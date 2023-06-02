
import React, { useState } from "react";

import { createDockerDesktopClient } from '@docker/extension-api-client';
import {
    Button,
    Card,
    Grid,
    TextField,
    Tooltip,
    Typography,
  } from "@mui/material";
  import HttpsIcon from '@mui/icons-material/Https';
  import AddModeratorIcon from '@mui/icons-material/AddModerator';

const client = createDockerDesktopClient();

function useDockerDesktopClient() {
  return client;
}

interface Props {
    value: string;
    onClick(v: string): void;
  }


export const Ingress = ({
    value,
  }: Props) => {
    const ddClient = useDockerDesktopClient();

    const exportCerts = async (domain: string ) => {
        await ddClient.docker.cli.exec("cp", [
            'ipedrazas_letsencrypt-desktop-extension-service:/certs/archive/' + domain + '/privkey1.pem',
            '/tmp/privkey.pem' 
          ]);
        await ddClient.docker.cli.exec("cp", [
            'ipedrazas_letsencrypt-desktop-extension-service:/certs/archive/' + domain + '/fullchain1.pem',
            '/tmp/fullchain.pem' 
          ]);
        await ddClient.docker.cli.exec("cp", [
            'ipedrazas_letsencrypt-desktop-extension-service:/certs/archive/' + domain + '/cert1.pem',
            '/tmp/cert.pem' 
          ]);
      };

    const installIngress = async (domain: string) => {
        await exportCerts(domain);
        // const cert = await ddClient.extension.host?.cli.exec("cat", [
        //     "/tmp/fullchain.pem",
        //     '/tmp/cert.pem' 
        //   ])
        const output = await ddClient.extension.host?.cli.exec("kubectl", [
            "create",
            "secret",
            "tls",
            domain,
            "--key=/tmp/privkey.pem",
            "--cert=/tmp/fullchain.pem"
          ]).then((result) => {
            console.log(result);
            ddClient.desktopUI.toast.success('SSL secret added successfully');
          });
    };

    return (
        <>
        <Tooltip title="Add as Kubernetes secret">
          <Button
              variant="contained"
              onClick={() => installIngress(value)}
              >
              <AddModeratorIcon />
          </Button>
        </Tooltip>
        </>
 );
}

// kubectl create secret tls test-tls --key="tls.key" --cert="tls.crt"
