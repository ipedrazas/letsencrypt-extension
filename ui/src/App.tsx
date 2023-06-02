import React from "react";
import {
  AppBar,
  Box,
  Grid,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";

import { createDockerDesktopClient } from "@docker/extension-api-client";

import { CertificateList } from './components/certList';
import { GoogleCloudDNS } from './components/gcloud';
import { LetsEncryptIcon } from './components/letsencrypt-icon';
import { checkK8sConnection, getCurrentHostContext , getIngress } from "./helper/kubernetes";
import { K8SIcon } from "./components/k8s-icon";
import { get } from "http";
const client = createDockerDesktopClient();

function useDockerDesktopClient() {
  return client;
}

export function App() {
  const ddClient = useDockerDesktopClient();
  const [hasK8S, setHasK8S] = React.useState(false);
  const [hasIngress, setIngress] = React.useState(false);
  const [hostContext, setHostContext] = React.useState<string | undefined>();
  const [namespace, setNamespace] = React.useState<string | undefined>();

  if (!hasK8S) {
    checkK8sConnection(ddClient).then((result) => {
      if (!result) {
        return;
      } 
      setHasK8S(true);
      getCurrentHostContext(ddClient).then((res) => {
        setHostContext(res.cluster);
        setNamespace(res.namespace || "default");
      });
      
    });
  }
   return (
    <>
      <AppBar position="relative" elevation={0}>
      <Toolbar>
      <LetsEncryptIcon />
        <Box display="flex" flexGrow={1} alignItems="center" flexWrap="wrap">
        
          <Typography variant="h3" color={(theme) => theme.palette.text.primary} sx={{ my: 2, mr: 3 }}>
           Let's Encrypt Docker Desktop Extension
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
      <Stack>
        <Typography mt={2}>
            In order to generate an SSL certificate, you need to provide a domain name and an email address.
            Also, since this extention is using the DNS challenge, you need to provide a Google credentials file (.json).
            <br /><br />
          </Typography>
        <Typography data-testid="heading" variant="h6" >
          Create or renew a Let's Encrypt certificate from Docker Desktop
        </Typography>
        
      
        <GoogleCloudDNS />
      
        <Grid container alignItems="center" gap={2}>
          <CertificateList />
        </Grid>

        <Stack direction="row" alignItems="start" spacing={2} sx={{ mt: 4 }}>
        {hasK8S ?
          <Typography mt={2} fontSize={16}>
            <K8SIcon/> <b>Kubernetes Cluster:</b> {hostContext}, <b>namespace:</b> {namespace}
          </Typography>
            : 
            <Typography mt={2} >
            Kubernetes context: Not connected
          </Typography>
          }
          
        </Stack>  
      </Stack>
    </>
  );
}
