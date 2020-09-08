import express from 'express';
import next from 'next';
import fs from 'fs';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });

const handle = app.getRequestHandler();

const config = dev
  ? {
      port: 80
    }
  : {
      port: 80
    };

app.prepare().then(() => {
  const server = express();

  server.use(express.json());

  server.get('/', async (req: any, res: any) =>
    res.send(await app.renderToHTML(req, res, '/home', req.query))
  );

  server.get('/static/*', async (req: any, res: any) => handle(req, res));

  server.get('/_next/*', async (req: any, res: any) => handle(req, res));

  server.get('/pdf', async (req: any, res: any) => {
    res.setHeader('Content-type', 'application/pdf');
    res.send(await fs.readFileSync('./static/text.pdf'));
  });

  server.get('*', async (req: any, res: any) =>
    res.send(await app.renderToHTML(req, res, '/404', req.query))
  );

  server.listen(config.port, () => {
    console.info(`Texbook frontend is listening on ${config.port}`);
  });
});
