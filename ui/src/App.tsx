
import {
  AppBar,
  Box,
  Grid,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { CertificateList } from './components/certList';
import { GoogleCloudDNS } from './components/gcloud';
import { LetsEncryptIcon } from './components/letsencrypt-icon';


export function App() {

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
        </Stack>
    </>
  );
}
