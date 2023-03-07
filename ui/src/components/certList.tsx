import React, { useEffect, useState } from "react";
import { createDockerDesktopClient } from '@docker/extension-api-client';
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
  } from "@mui/material";

import VerifiedIcon from '@mui/icons-material/Verified';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import DownloadIcon from '@mui/icons-material/Download';
import { green } from "@mui/material/colors";

const client = createDockerDesktopClient();

function useDockerDesktopClient() {
  return client;
}

export function CertificateList() {
    const ddClient = useDockerDesktopClient();
    const [certificates, setCertificates] = useState<any[]>([]);


    useEffect(() => {
        const instancePromise = listCertificates();
    }, []);


    const listCertificates = async () => {
        await ddClient.extension.vm?.service?.get("/certificates")
          .then((result: any) =>{
            setCertificates(result);
          })
          .catch((error: any) => {
            console.log(error);
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
                                    <TableCell >Cert</TableCell>
                                    <TableCell >Chain</TableCell>
                                    <TableCell >Private Key</TableCell>
                                    <TableCell ></TableCell>
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
                                        <TableCell >
                                            {certificate.cert}
                                        </TableCell>
                                        <TableCell >
                                            {certificate.chain}
                                        </TableCell>
                                        <TableCell >
                                            {certificate.priv_key}
                                        </TableCell>
                                        <TableCell >
                                            <DownloadIcon />
                                        </TableCell>

                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
        </>
 );
}
