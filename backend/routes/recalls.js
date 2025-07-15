const express = require('express');
const router = express.Router();
const Recall = require('../models/Recall');

// Ajouter un rappel
router.post('/', async (req, res) => {
  try {
    const { operator, clientName, clientPhone, recallDate } = req.body;
    if (!operator || !clientName || !clientPhone || !recallDate) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }
    const recall = new Recall({ operator, clientName, clientPhone, recallDate });
    await recall.save();
    res.status(201).json(recall);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Récupérer les rappels (tous pour admin, ou filtrés par opérateur)
router.get('/', async (req, res) => {
  try {
    const { operator, admin } = req.query;
    let recalls;
    if (admin === 'true') {
      recalls = await Recall.find();
    } else if (operator) {
      recalls = await Recall.find({ operator });
    } else {
      return res.status(400).json({ error: 'Opérateur requis ou admin=true' });
    }
    res.json(recalls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Supprimer un rappel (par id)
router.delete('/:id', async (req, res) => {
  try {
    await Recall.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 