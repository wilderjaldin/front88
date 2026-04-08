// utils/pdfWorker.js
import { pdfjs } from 'react-pdf';

// Configura el worker local
pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
