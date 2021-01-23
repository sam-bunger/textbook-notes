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
    res.send(await app.renderToHTML(req, res, '/landing', req.query))
  );

  server.get('/editor', async (req: any, res: any) =>
    res.send(await app.renderToHTML(req, res, '/editor', req.query))
  );

  server.get('/pdfjs/:type', async (req: any, res: any) => {
    try {
      if (req.params.type == 'lib') {
        const file = fs.readFileSync('./node_modules/pdfjs-dist/build/pdf.js');
        res.type('.js');
        return res.send(file);
      } else if (req.params.type == 'viewer') {
        const file = fs.readFileSync('./node_modules/pdfjs-dist/web/pdf_viewer.js');
        res.type('.js');
        return res.send(file);
      } else if (req.params.type == 'view-css') {
        const file = fs.readFileSync('./node_modules/pdfjs-dist/web/pdf_viewer.css');
        res.type('.css');
        return res.send(file);
      } else if (req.params.type == 'worker') {
        const file = fs.readFileSync('./node_modules/pdfjs-dist/build/pdf.worker.js');
        res.type('.js');
        return res.send(file);
      }
      res.sendStatus(404);
    } catch (e) {
      console.error(e);
      res.status(500).send(e.toString());
    }
  });

  /*** WEB CONTENT ***/

  server.get('/api/getNotes', async (req: any, res: any) => {
    res.send({
      document: 'http://localhost/static/text.pdf',
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
    console.info(`Textbook frontend is listening on ${config.port}`);
  });
});
