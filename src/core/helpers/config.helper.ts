import { INestApplication, Logger } from '@nestjs/common';

let app: INestApplication | undefined;
const processLogger = new Logger('Process');

export async function handleFatalError(label: string, detail?: string) {
  processLogger.error(label, detail);

  const forceExit = setTimeout(() => process.exit(1), 5000);
  forceExit.unref();

  try {
    await app?.close();
  } catch (closeError) {
    processLogger.error('Error during graceful shutdown', String(closeError));
  } finally {
    process.exit(1);
  }
}
