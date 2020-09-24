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

  /*** WEB PAGE CONTENT ***/
  server.get('/static/*', async (req: any, res: any) => handle(req, res));

  server.get('/_next/*', async (req: any, res: any) => handle(req, res));

  /*** WEB PAGES ***/

  server.get('/', async (req: any, res: any) =>
    res.send(await app.renderToHTML(req, res, '/home', req.query))
  );

  server.get('/editor', async (req: any, res: any) =>
    res.send(await app.renderToHTML(req, res, '/home', req.query))
  );

  /*** WEB CONTENT ***/

  server.get('/api/getNotes', async (req: any, res: any) => {
    res.send({
      document: 'http://localhost/static/text2.pdf',
      currentPage: 1,
      projectName: 'Operating Systems',
      categories: [],
      links: {},
      pages: {}
    });
  });

  server.post('/editor/saveNotes', async (req: any, res: any) => {});

  /*** 404 PAGE ***/

  server.get('*', async (req: any, res: any) =>
    res.send(await app.renderToHTML(req, res, '/404', req.query))
  );

  /*** LISTEN ***/
  server.listen(config.port, () => {
    console.info(`Texbook frontend is listening on ${config.port}`);
  });
});
