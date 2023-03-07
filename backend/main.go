package main

import (
	"context"
	"crypto/x509"
	"encoding/pem"
	"flag"
	"fmt"
	"log"
	"math"
	"net"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"time"

	"github.com/labstack/echo/middleware"

	"github.com/labstack/echo"
	"github.com/sirupsen/logrus"
)

var logger = logrus.New()

func main() {
	var socketPath string
	flag.StringVar(&socketPath, "socket", "/run/guest-services/backend.sock", "Unix domain socket to listen on")
	flag.Parse()

	_ = os.RemoveAll(socketPath)

	logger.SetOutput(os.Stdout)

	logMiddleware := middleware.LoggerWithConfig(middleware.LoggerConfig{
		Skipper: middleware.DefaultSkipper,
		Format: `{"time":"${time_rfc3339_nano}","id":"${id}",` +
			`"method":"${method}","uri":"${uri}",` +
			`"status":${status},"error":"${error}"` +
			`}` + "\n",
		CustomTimeFormat: "2006-01-02 15:04:05.00000",
		Output:           logger.Writer(),
	})

	logger.Infof("Starting listening on %s\n", socketPath)
	router := echo.New()
	router.HideBanner = true
	router.Use(logMiddleware)

	ln, err := listen(socketPath)
	if err != nil {
		logger.Fatal(err)
	}
	router.Listener = ln

	router.GET("/certificates", getCerts)

	// Start server
	go func() {
		server := &http.Server{
			Addr: "",
		}
		if err := router.StartServer(server); err != nil && err != http.ErrServerClosed {
			logger.Fatal("shutting down the server")
		}
	}()

	// Wait for interrupt signal to gracefully shut down the server with a timeout of 10 seconds.
	// Use a buffered channel to avoid missing signals as recommended for signal.Notify
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt)
	<-quit
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := router.Shutdown(ctx); err != nil {
		logger.Fatal(err)
	}
}

func listen(path string) (net.Listener, error) {
	return net.Listen("unix", path)
}

func getCerts(c echo.Context) error {
	domains := []Cert{}
	basePath := "/certs/live"
	err := filepath.Walk(basePath,
		func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}
			if info.IsDir() {
				cert, err := hydrateCert(info.Name())
				if err != nil {
					logger.Infof("Certs not found in %s - %s", info.Name(), err.Error())
					return nil
				}

				domains = append(domains, *cert)
			}
			return nil
		})
	if err != nil {
		log.Println(err)
	}

	return c.JSON(http.StatusOK, domains)
}

func hydrateCert(domain string) (*Cert, error) {
	cert := &Cert{
		PrivKey: "/certs/live/" + domain + "/privkey.pem",
		Valid:   false,
		Chain:   "/certs/live/" + domain + "/fullchain.pem",
		Cert:    "/certs/live/" + domain + "/cert.pem",
	}

	cert, err := verifyCert(cert, domain)
	if err != nil {
		return nil, err
	}

	return cert, nil
}

func verifyCert(cert *Cert, name string) (*Cert, error) {
	fullChain, err := os.ReadFile(cert.Chain)
	if err != nil {
		return nil, err
	}
	certfile, err := os.ReadFile(cert.Cert)
	if err != nil {
		return nil, err
	}
	roots := x509.NewCertPool()
	ok := roots.AppendCertsFromPEM(fullChain)
	if !ok {
		return nil, fmt.Errorf("failed to parse root certificate")
	}

	block, _ := pem.Decode(certfile)
	if block == nil {
		return nil, fmt.Errorf("failed to parse certificate PEM")
	}
	x509Cert, err := x509.ParseCertificate(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse certificate: %v", err.Error())
	}

	opts := x509.VerifyOptions{
		// DNSName: name,
		Roots: roots,
	}

	if _, err := x509Cert.Verify(opts); err != nil {
		return nil, err
	}
	cert.Expiry = x509Cert.NotAfter.Format(time.UnixDate)
	cert.Domains = x509Cert.DNSNames
	cert.Valid = true
	cert.DaysLeft = int64(math.Round(float64(time.Until(x509Cert.NotAfter).Hours() / 24)))
	return cert, nil
}

type Cert struct {
	Domains  []string `json:"domains,omitempty"`
	Expiry   string   `json:"expiry,omitempty"`
	Valid    bool     `json:"valid,omitempty"`
	DaysLeft int64    `json:"days_left,omitempty"`
	Chain    string   `json:"chain,omitempty"`
	PrivKey  string   `json:"priv_key,omitempty"`
	Cert     string   `json:"cert,omitempty"`
}
