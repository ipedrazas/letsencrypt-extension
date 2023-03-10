import React, { useState } from "react";

import { createDockerDesktopClient } from '@docker/extension-api-client';
import {
    Button,
    Card,
    Grid,
    TextField,
    Typography,
  } from "@mui/material";


const client = createDockerDesktopClient();

function useDockerDesktopClient() {
  return client;
}


export function GoogleCloudDNS() {

  const ddClient = useDockerDesktopClient();

  const [file, setFile] = useState<string>("");
  const [path, setPath] = useState<string>("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [email, setEmail] = useState<string>("");
  const [domain, setDomain] = useState<string>("");
  const [logs, setLogs] = useState<(string | undefined)[]>([]);
  
  const extractFilename = (filepath: string) => {
    const pathArray = filepath.split("/");
    const lastIndex = pathArray.length - 1;
    return pathArray[lastIndex];
 };

  const addFile = async (path: string ) => {
    await ddClient.docker.cli.exec("cp", [
      path,
      'ipedrazas_letsencrypt-desktop-extension-service:/secrets'
    ]).then((result) => {
      setFile(extractFilename(path));
    });
  };



  const getCertificate = async () => {
    setIsLoading(true);
    let cmdArgs = [
      "--rm",
      "-v",
      path + ":/secrets",
      "-v",
      "ipedrazas_letsencrypt-desktop-extension_certificates:/etc/letsencrypt",
      'certbot/dns-google:latest',
      'certonly',
      '--dns-google',
      '--dns-google-credentials',
      '/secrets/' + file,
    ];
    let domains = domain.split(" ")
    for (let index = 0; index < domains.length; index++) {
      const element = domains[index];
      cmdArgs.push("-d");
      cmdArgs.push(element);
    }
    cmdArgs.push("-m");
    cmdArgs.push(email);
    cmdArgs.push("--agree-tos");
    cmdArgs.push("--no-eff-email");
    console.log(cmdArgs);
    const requestCert = ddClient.docker.cli.exec("run", cmdArgs, {
      stream: {
        onOutput(data): void {
          setLogs((current) => [...current, data.stdout ? data.stdout : data.stderr]);
        },
        onError(error: unknown): void {
          ddClient.desktopUI.toast.error('An error occurred');
          console.log(error);
        },
        onClose(exitCode) {
          console.log(`onClose with exit code ${exitCode}`);
          ddClient.desktopUI.toast.success('Certificate created successfully');
        },
        splitOutputLines: true,
      },
    });
  };


  const selectImportJSONFile = () => {
    ddClient.desktopUI.dialog
      .showOpenDialog({
        properties: ["openFile"],
        filters: [
          {
            name: "Credentials file",
            extensions: ["json"],
          },
        ], // should contain extension without wildcards or dots
      })
      .then((result) => {
        if (result.canceled) {
          return;
        }
        // setPath(result.filePaths[0]);
        setPath(result.filePaths[0].replace(extractFilename(result.filePaths[0]), ''));
        setFile(extractFilename(result.filePaths[0]));
        
        // addFile(result.filePaths[0]);
      });
  };


    return (
        <>
        <TextField
                id="domain"
                label={[
                  "Domain name",
                ]}
                placeholder="e.g. mydomain.com or *.mydomain.com"
                focused
                onChange={(e) => setDomain(e.target.value)}
              />
          <TextField
                id="email"
                label={[
                  "Email",
                ]}
                placeholder="Email address to receive notifications about certificate expiration"
                focused
                onChange={(e) => setEmail(e.target.value)}
              />

            <Grid container alignItems="center" gap={2}>
              <Button
                size="large"
                variant="outlined"
                onClick={selectImportJSONFile}
              >
                Select a Google credentials file (.json).
              </Button>
              <Typography mt={2}>
                {file}
                <br /><br />
            </Typography>

              <Button
                size="large"

                onClick={getCertificate}
              >
                Generate Certificate
              </Button>
            </Grid>
            
              {isLoading ?(
                <Grid container alignItems="center" gap={2}>
                  <Typography data-testid="heading" variant="h4" role="title">
                  <br /><br />
                      Generating the certificate takes around 90 seconds, please be patient.
                      <br /><br />  <br /><br />
                  </Typography>

                  <Card style={{ padding: 20, pointerEvents: 'none' }}>
                    {logs.map(log => (
                      <>
                        <Typography>
                          {log}
                        </Typography>
                        <br />
                      </>
                    ))}
                  </Card>
                  </Grid>
              ) : (
                <Typography></Typography>)}
            
        </>
 );
}
