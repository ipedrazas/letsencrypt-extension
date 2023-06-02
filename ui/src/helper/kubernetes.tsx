import { v1 } from "@docker/extension-api-client-types";

export const DockerDesktop = "docker-desktop";
export const CurrentExtensionContext = "currentExtensionContext";
export const IsK8sEnabled = "isK8sEnabled";

export const listHostContexts = async (ddClient: v1.DockerDesktopClient) => {
  const output = await ddClient.extension.host?.cli.exec("kubectl", [
    "config",
    "view",
    "-o",
    "jsonpath='{.contexts}'",
  ]);
  if (output?.stderr) {
    console.log(output.stderr);
    return output.stderr;
  }

  return output?.stdout;
};

export const setDockerDesktopContext = async (
  ddClient: v1.DockerDesktopClient
) => {
  const output = await ddClient.extension.host?.cli.exec("kubectl", [
    "config",
    "use-context",
    "docker-desktop",
  ]);
  if (output?.stderr) {
    return output.stderr;
  }
  return output?.stdout;
};

export const getCurrentHostContext = async (
  ddClient: v1.DockerDesktopClient
) => {
  const output = await ddClient.extension.host?.cli.exec("kubectl", [
    "config",
    "view",
    "--minify",
    "-o",
    "jsonpath='{..context}'",
  ]);
  if (output?.stderr) {
    return output.stderr;
  }
  
  return JSON.parse(output?.stdout || "");
};

export const checkK8sConnection = async (ddClient: v1.DockerDesktopClient) => {
  try {
    let output = await ddClient.extension.host?.cli.exec("kubectl", [
      "cluster-info",
      "--request-timeout",
      "2s",
    ]);
    if (output?.stderr) {
      console.log(output.stderr);
      return "false";
    }
    return "true";
  } catch (e: any) {
    console.log("[checkK8sConnection] error : ", e);
    return "false";
  }
};

export const listNamespaces = async (ddClient: v1.DockerDesktopClient) => {
  const output = await ddClient.extension.host?.cli.exec("kubectl", [
    "get",
    "namespaces",
    "--no-headers",
    "-o",
    'custom-columns=":metadata.name"',
    "--context",
    "docker-desktop",
  ]);
  if (output?.stderr) {
    return output.stderr;
  }
  return output?.stdout;
};

export const getIngress = async (ddClient: v1.DockerDesktopClient) => {
  const output = await ddClient.extension.host?.cli.exec("kubectl", [
    "get",
    "ingress",
    "-A",
    "-o",
    'json',
  ]);
  if (output?.stderr) {
    return output.stderr;
  }
  let ings = JSON.parse(output?.stdout || "[]");
  return ings.items;
  
}

