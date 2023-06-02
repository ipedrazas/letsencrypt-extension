import React, { useEffect, useState } from "react";
import { createDockerDesktopClient } from '@docker/extension-api-client';
import {
    Button,
    Link,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
  } from "@mui/material";

import VerifiedIcon from '@mui/icons-material/Verified';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import DownloadIcon from '@mui/icons-material/Download';
import { Ingress } from "./ingress";
import { getIngress } from "../helper/kubernetes";

const client = createDockerDesktopClient();

function useDockerDesktopClient() {
  return client;
}

export function CertificateList() {
    const ddClient = useDockerDesktopClient();
    const [certificates, setCertificates] = useState<any[]>([]);
    const [hasIngress, setIngress] = React.useState(false);
    const [ingressList, setIngressList] = React.useState<any[]>([]);

    
    if(!hasIngress) {
        getIngress(ddClient).then((ings) => {
            if (!ings) {
                return;
            }
            let hosts = [];
            for (let i = 0; i < ings.length; i++) {
                const element = ings[i];
                let host = element.spec.rules[0].host;
                hosts.push(host);
            }
            setIngressList(ings);
            setIngress(true);
        });
    }

    useEffect(() => {
        const instancePromise = listCertificates();
    }, []);

    const getIngressCert = (cert: string) => {
        for (let i = 0; i < ingressList.length; i++) {
            const ing = ingressList[i];
            let element = ing.spec.rules[0].host;
            if (element == cert) {
                return (<VerifiedIcon sx={{color: "teal"}}/>);
            }
            // if it's a wildcard cert, we check if the domain is a subdomain of the cert
            // *.something.else.com will match abc.something.else.com
            if (cert.startsWith("*.")) {
                let domain = cert.substring(2);
                if (element.endsWith(domain)) {
                    let scheme = ing.spec.tls? "https" : "http";
                    return (                        
                    <Link
                        onClick={async () => {
                            ddClient.host.openExternal(scheme + "://" + element)
                        }}>
                        {element}
                    </Link>
    
                   );
                }
            }
        }
        return null;
    }

    const listCertificates = async () => {
        await ddClient.extension.vm?.service?.get("/certificates")
          .then((result: any) =>{
            setCertificates(result);
          })
          .catch((error: any) => {
            console.log(error);
          });
      };

    const downloadZip = async (domain: string, path: string) => {
        await ddClient.extension.vm?.service?.get("/download/" + domain).then(response => {
            exportZip(domain, path);
        })
    };

    const exportZip = async (domain: string, path: string ) => {
        if (path == "") {
            return;
        }
        let args = [
            'ipedrazas_letsencrypt-desktop-extension-service:/certs/archive/' + domain + '.zip',
            path + '/' + domain + '.zip'
          ];
        await ddClient.docker.cli.exec("cp", args).then((result) => {
            ddClient.desktopUI.toast.success('Certificates exported successfully');
        });
      };

    const selectExportDirectory = (domain: string) => {
        ddClient.desktopUI.dialog
          .showOpenDialog({
            properties: ["openDirectory"],
          })
          .then((result) => {
            if (result.canceled) {
              return;
            }
            downloadZip(domain, result.filePaths[0]);
          });
      };


    return (
        <>
        <Typography variant={"h3"}><br />< br />Certificates in the Extension</Typography>
                    <TableContainer component={Paper}>
                        <Table sx={{minWidth: 650}} aria-label="simple table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Valid</TableCell>
                                    <TableCell align="right">Domain</TableCell>
                                    <TableCell align="right">Expiry Date</TableCell>
                                    <TableCell align="right">Days left</TableCell>
                                    <TableCell align="right">Ingress</TableCell>
                                    <TableCell align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {certificates.map((certificate: any, index: number) => (
                                    <TableRow
                                        key={index}
                                        sx={{'&:last-child td, &:last-child th': {border: 0}}}
                                    >
                                        <TableCell align="right">
                                            {certificate.valid ? 
                                            ( <VerifiedIcon sx={{color: "teal"}}/>) : ( <HighlightOffIcon/>)}
                                            
                                        </TableCell>
                                        <TableCell align="right">
                                            {certificate.domains.map((domain: string, index: number) => (
                                                <div key={index}>{domain}</div>
                                            ))}
                                        </TableCell>
                                        <TableCell align="right">
                                            {certificate.expiry}
                                        </TableCell>
                                        <TableCell align="right">
                                            {certificate.days_left}
                                        </TableCell>
                                        <TableCell align="right">
                                            {getIngressCert(certificate.domains[0]) }
                                        </TableCell>
                                     
                                        <TableCell >
                                            <Tooltip title="Export Certificate">
                                                <Button
                                                    variant="contained"
                                                    onClick={() => selectExportDirectory(certificate.path)}
                                                    >
                                                <DownloadIcon />
                                                </Button>
                                            </Tooltip>
                                                &nbsp;
                                            
                                            <Ingress value={certificate.path} onClick={selectExportDirectory} />
                                            
                                        </TableCell>

                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
        </>
 );
}
