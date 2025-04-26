import { uuid } from '../src/lib/server/utils/uuid';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

export default async () => {
	const id = '8675309';
	const buffer = await QRCode.toBuffer(id);
	await fs.promises.writeFile(path.join(process.cwd(), 'scripts', `${id}.png`), buffer);
};
