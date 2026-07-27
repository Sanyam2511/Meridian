import { createAppServer } from './server';

const PORT = process.env.PORT || 3000;

const { server } = createAppServer();

server.listen(PORT, () => {
  console.log(`[Gateway] Real-Time Gateway listening on port ${PORT}`);
});
