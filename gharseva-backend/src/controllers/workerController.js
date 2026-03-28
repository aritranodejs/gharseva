const workerService = require('../services/workerService');
const { sendSuccess, sendError } = require('../utils/responseHelper');

class WorkerController {
  async register(req, res) {
    try {
      const uploadFiles = req.files || {};
      const profilePicUrl = uploadFiles['profilePicture'] ? `/uploads/${uploadFiles['profilePicture'][0].filename}` : '';
      
      const workerData = {
        name: req.body.name,
        phoneNumber: req.body.phoneNumber,
        password: req.body.password,
        skills: req.body.skills ? JSON.parse(req.body.skills) : ['cleaning'],
        pincodes: req.body.pincodes ? JSON.parse(req.body.pincodes) : ['700156'],
        categories: req.body.categories ? JSON.parse(req.body.categories) : [],
        profilePicture: profilePicUrl,
        aadhaarNumber: req.body.aadhaarNumber,
        panNumber: req.body.panNumber,
        aadhaarImage: uploadFiles['aadhaarImage'] ? `/uploads/${uploadFiles['aadhaarImage'][0].filename}` : '',
        panImage: uploadFiles['panImage'] ? `/uploads/${uploadFiles['panImage'][0].filename}` : '',
        policeVerification: uploadFiles['policeVerification'] ? `/uploads/${uploadFiles['policeVerification'][0].filename}` : '',
        certification: uploadFiles['certification'] ? `/uploads/${uploadFiles['certification'][0].filename}` : '',
        documents: uploadFiles['documents'] ? uploadFiles['documents'].map(d => `/uploads/${d.filename}`) : []
      };

      const newWorker = await workerService.registerWorker(workerData);
      require('../utils/responseHelper').sendSuccess(res, newWorker, 'Registration successful. Waiting for admin approval.', 201);
    } catch (err) {
      require('../utils/responseHelper').sendError(res, err.message, 400);
    }
  }

  async updateProfile(req, res) {
    try {
      const uploadFiles = req.files || {};
      const updates = { ...req.body };
      if (uploadFiles['profilePicture']) {
         updates.profilePicture = `/uploads/${uploadFiles['profilePicture'][0].filename}`;
      }
      const updatedWorker = await workerService.updateWorkerProfile(req.worker._id, updates);
      require('../utils/responseHelper').sendSuccess(res, updatedWorker, 'Profile updated');
    } catch (err) {
      require('../utils/responseHelper').sendError(res, err.message, 400);
    }
  }

  async login(req, res) {
    const { phoneNumber, password } = req.body;
    try {
      const data = await workerService.authenticate(phoneNumber, password);
      sendSuccess(res, data, 'Login successful');
    } catch (err) {
      sendError(res, err.message, 401);
    }
  }

  async getProfile(req, res) {
    try {
      const worker = await workerService.getWorkerProfile(req.worker._id);
      sendSuccess(res, worker);
    } catch (err) {
      sendError(res, err.message, 404);
    }
  }

  async toggleOnline(req, res) {
    const { isOnline } = req.body;
    try {
      const worker = await workerService.setOnlineStatus(req.worker._id, isOnline);
      sendSuccess(res, worker, `Status updated to ${isOnline ? 'Online' : 'Offline'}`);
    } catch (err) {
      sendError(res, 'Error updating status');
    }
  }

  async updateLocation(req, res) {
    const { coordinates } = req.body; // [lng, lat]
    try {
      const worker = await workerService.updateLocation(req.worker._id, coordinates);
      sendSuccess(res, { coordinates: worker.location.coordinates }, 'Location updated');
    } catch (err) {
      sendError(res, 'Error updating location');
    }
  }
}

module.exports = new WorkerController();
