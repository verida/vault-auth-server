import express from 'express';
import Controller from './controller';

const router = express.Router();

router.get('/request', Controller.request);
router.post('/response', Controller.response);

export default router;