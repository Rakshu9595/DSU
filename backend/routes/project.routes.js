import { Router } from 'express';
import * as projectController from '../controllers/project.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateRequest } from '../middleware/validate-request.js';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator.js';

const router = Router();

router.use(authenticate);

router.post('/', validateRequest({ body: createProjectSchema }), projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:projectId', projectController.getProject);
router.put('/:projectId', validateRequest({ body: updateProjectSchema }), projectController.updateProject);
router.delete('/:projectId', projectController.deleteProject);

export default router;
