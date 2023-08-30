const express = require("express");
const https = require("https");
const fs = require("fs");
const axios = require("axios");
const app = express();
const port = 443; // Puerto en el que escuchará el servidor

const nodes = [
  "https://engine.deathwing.me",
  "https://enginerpc.com",
  "https://herpc.dtools.dev",
  "https://ctpmain.com",
  "https://he.atexoras.com:2083",
  "https://herpc.liotes.com",
  "https://herpc.tribaldex.com",
  "https://engine.hive.pizza",
  "https://api.primersion.com",
  "https://engine.rishipanthee.com",
  "https://api.primersion.com",
  "https://api.hive-engine.com",
  "https://api2.hive-engine.com",
  "https://herpc.actifit.io",
  "https://api.primersion.com",
];

const privateKey = fs.readFileSync(
  "/etc/letsencrypt/live/nodo.hivekings.io/privkey.pem",
  "utf8"
);
const certificate = fs.readFileSync(
  "/etc/letsencrypt/live/nodo.hivekings.io/cert.pem",
  "utf8"
);
const ca = fs.readFileSync(
  "/etc/letsencrypt/live/nodo.hivekings.io/chain.pem",
  "utf8"
);

const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca,
};

async function findAvailableNode() {
  for (const node of nodes) {
    try {
      const response = await axios.get(node);
      if (response.status === 200) {
        return node;
      }
    } catch (error) {
      // Si hay un error, el nodo no está disponible
      console.log("ningun nodo disponible")
    }
  }
  return null; // Ningún nodo disponible
}

app.get("/", async (req, res) => {
  const selectedNode = await findAvailableNode();

  if (selectedNode) {
    try {
      const response = await axios.get(selectedNode + req.url);
      res.send(response.data);
    } catch (error) {
      res.status(500).send("Error al procesar la solicitud");
    }
  } else {
    res.status(503).send("No hay nodos disponibles");
  }
});

app.get("*", async (req, res) => {
  const requestUrl = (await findAvailableNode())+ req.url;

  try {
    const response = await axios.get(requestUrl);
    res.send(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).send(error.response.data);
    } else {
      res.status(500).send("Error al procesar la solicitud");
    }
  }
});

app.all("*", async (req, res) => {
  const requestUrl = (await findAvailableNode()) + req.url;
  const method = req.method; // Obtenemos el método de la solicitud

  try {
    const response = await axios.request({
      url: requestUrl,
      method: method, // Usamos el método de la solicitud original
      data: req.body, // Pasamos los datos de la solicitud si es necesario
    });

    res.send(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).send(error.response.data);
    } else {
      res.status(500).send("Error al procesar la solicitud");
    }
  }
});

// Crea un servidor HTTPS utilizando los certificados y claves
const httpsServer = https.createServer(credentials, app);

httpsServer.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
