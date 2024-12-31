// 
//  Rue Development Server
// 
//  created by Aaron Meche
//  for Rue the Dachshund
// 


import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import serveStatic from 'serve-static';
import { View, getBaseJS, getBaseHeadHTML, getBaseCSS } from '../compiler.js';
import express from 'express';


// Directories
const __filename = fileURLToPath(import.meta.url);
const __systemDir = path.dirname(__filename);
const __projectDir = path.join(__systemDir, "..", "..")
const __publicDir = path.join(__projectDir, "public")
const __rueDir = path.join(__projectDir, "rue")
const __srcDir = path.join(__projectDir, "src")
const __assetsDir = path.join(__rueDir, "assets")


// Customize
const __port = 3000;


// HTTP Config
const privateKey = fs.readFileSync(path.join(__systemDir, 'https/key.pem'), 'utf-8');
const certificate = fs.readFileSync(path.join(__systemDir, 'https/cert.pem'), 'utf-8');
const credentials = { key: privateKey, cert: certificate };


// Version Control (Live Updates)
const __version = { version: Date.now() };
__version.version = (__version.version % 999_999)


// Main Server
const app = express();
app.use(serveStatic(path.join(__projectDir, 'public')));

// Routing
app.get('/', (req, res) => processPageCall(req, res, true));
app.get('/version', (req, res) => res.json(__version));
app.get('/iosapp', (req, res) => res.send(__iosWebApp + "<iframe src='/' style='height:100vh;width:100vw;position:fixed;top:0;left:0;border:none;outline:none;' /> <style>body{margin:0;}</style>"));
app.get('/:filename', (req, res) => processPageCall(req, res));


// Functions
function processPageCall(req, res, defaultRouteBool) {
    const filePath = req.params.filename;
    const routePath = defaultRouteBool ? path.join(__srcDir, 'View.rue') : path.join(__srcDir, filePath, 'View.rue');
    openPage(req, res, routePath);
}
function openPage(req, res, routePath) {
    try {
        const fileContent = fs.readFileSync(routePath, 'utf-8');
        try{
            new View(fileContent, DOM => {
                displayView(res, DOM);
            }, __srcDir);
        } catch (error) {
            handleError(res, error)
        }
    } catch (error) {
        handleError(res, error)
    }
}
function displayView(res, DOM) {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                ${DOM.head}
                ${getBaseHeadHTML(__assetsDir)}
            </head>
            <body>
                ${DOM.html}
                <script>${getBaseJS(__assetsDir, true)} ${DOM.js}</script>
                <style>${getBaseCSS(__assetsDir)} ${DOM.css}</style>
                ${DOM.endHtml}
            </body>
        </html>
    `)
}
function handleError(res, error) {
    try {
        // Rue Custom Error Page
        const fileContent = fs.readFileSync(path.join(__assetsDir, "error.rue"), 'utf-8');
        new View(fileContent, DOM => {
            displayView(res, DOM);
        }, __assetsDir);
    } catch(error) {
        // Default Error
        res.send("Major Error")
    }
}


// HTTPS server
https.createServer(credentials, app).listen(__port, () => {
    console.log('HTTPS Server running on https://localhost:' + __port);
});