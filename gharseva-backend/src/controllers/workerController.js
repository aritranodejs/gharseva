const workerService = require('../services/workerService');
const Worker = require('../models/Worker');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { uploadFileBuffer } = require('../services/imageUpload');

class WorkerController {
  async register(req, res) {
    try {
      const uploadFiles = req.files || {};

      // Standardize storage paths to start with /uploads for both local and ImageKit
      const profilePicUrl = uploadFiles['profilePicture']
        ? await uploadFileBuffer(uploadFiles['profilePicture'][0], '/uploads/profilePicture')
        : '';
      const aadhaarUrl = uploadFiles['aadhaarImage']
        ? await uploadFileBuffer(uploadFiles['aadhaarImage'][0], '/uploads/aadhaarImage')
        : '';
      const panUrl = uploadFiles['panImage']
        ? await uploadFileBuffer(uploadFiles['panImage'][0], '/uploads/panImage')
        : '';
      const policeUrl = uploadFiles['policeVerification']
        ? await uploadFileBuffer(uploadFiles['policeVerification'][0], '/uploads/policeVerification')
        : '';
      const certUrl = uploadFiles['certification']
        ? await uploadFileBuffer(uploadFiles['certification'][0], '/uploads/certification')
        : '';
      const docUrls = uploadFiles['documents']
        ? await Promise.all(uploadFiles['documents'].map(d => uploadFileBuffer(d, '/uploads/documents')))
        : [];

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
        aadhaarImage: aadhaarUrl,
        panImage: panUrl,
        policeVerification: policeUrl,
        certification: certUrl,
        documents: docUrls
      };

      const newWorker = await workerService.registerWorker(workerData);
      sendSuccess(res, newWorker, 'Registration successful. Waiting for admin approval.', 201);
    } catch (err) {
      sendError(res, err.message, 400);
    }
  }

  async updateProfile(req, res) {
    try {
      const uploadFiles = req.files || {};
      const updates = { ...req.body };
      
      if (uploadFiles['profilePicture']) {
         updates.profilePicture = await uploadFileBuffer(uploadFiles['profilePicture'][0], '/uploads/profilePicture');
      }
      if (uploadFiles['aadhaarImage']) {
         updates.aadhaarImage = await uploadFileBuffer(uploadFiles['aadhaarImage'][0], '/uploads/aadhaarImage');
      }
      if (uploadFiles['panImage']) {
         updates.panImage = await uploadFileBuffer(uploadFiles['panImage'][0], '/uploads/panImage');
      }
      if (uploadFiles['policeVerification']) {
         updates.policeVerification = await uploadFileBuffer(uploadFiles['policeVerification'][0], '/uploads/policeVerification');
      }
      if (uploadFiles['certification']) {
         updates.certification = await uploadFileBuffer(uploadFiles['certification'][0], '/uploads/certification');
      }
      
      const updatedWorker = await workerService.updateWorkerProfile(req.worker._id, updates);
      sendSuccess(res, updatedWorker, 'Profile updated');
    } catch (err) {
      sendError(res, err.message, 400);
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

  async savePushToken(req, res) {
    const { token, platform } = req.body;
    try {
      if (!token) return sendError(res, 'Push token required', 400);
      await Worker.findByIdAndUpdate(req.worker._id, { pushToken: token });
      sendSuccess(res, { token, platform }, 'Push token saved');
    } catch (err) {
      sendError(res, 'Error saving push token');
    }
  }
}

module.exports = new WorkerController();
