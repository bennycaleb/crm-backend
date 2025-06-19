const express = require('express');
const router = express.Router();
const axios = require('axios');

// Fonction pour envoyer à Nextera
const sendToNextera = async (req, res) => {
  try {
    const order = req.body;
    console.log('Nextera: Données reçues:', JSON.stringify(order, null, 2));
    
    // Mapping conforme au Swagger gl-net
    const payload = {
      Shipping: {
        Account: "TEST",
        Reference: order.reference || "REF-XXX",
        TransitGatewayId: "CDG",
        Agent: "FR-NTUPS",
        ServiceCode: "ECO",
        COD: 0,
        OnLineCOD: 0,
        IOSS: "",
        Incoterm: "DDP",
        WeightUnit: "kg",
        DimensionUnit: "cm",
        Currency: "EUR",
        OrderFulfillment: true,
        Warehouse: "CDG"
      },
      Shipper: {
        CompanyName: order.shipperCompany || "",
        ContactName: order.shipperName || "",
        Street: order.shipperAddress || "",
        AddressLine2: "",
        AddressLine3: "",
        PostCode: order.shipperPostalCode || "",
        City: order.shipperCity || "",
        State: "",
        Country: order.shipperCountry || "FR",
        Email: order.shipperEmail || "",
        Phone: order.shipperPhone || "",
        SecondPhone: "",
        Eori: "",
        Notes: "",
        Reference1: "",
        Reference2: ""
      },
      Consignee: {
        CompanyName: order.consigneeCompany || "",
        ContactName: order.consigneeName || "",
        Street: order.consigneeAddress || "",
        AddressLine2: "",
        AddressLine3: "",
        PostCode: order.consigneePostalCode || "",
        City: order.consigneeCity || "",
        State: "",
        Country: order.consigneeCountry || "FR",
        Email: order.consigneeEmail || "",
        Phone: order.consigneePhone || "",
        SecondPhone: "",
        Eori: "",
        Notes: "",
        Reference1: "",
        Reference2: ""
      },
      Pieces: [
        {
          Number: "",
          Reference: "",
          Weight: order.weight || 0,
          Length: order.length || 0,
          Width: order.width || 0,
          Height: order.height || 0
        }
      ],
      Items: [
        {
          Code: order.itemCode || "",
          Reference: "",
          Description: order.itemDescription || "",
          GoodsOrigin: "",
          HSCode: "",
          Quantity: order.totalItems || 1,
          Value: order.value || 0,
          Weight: order.weight || 0,
          Dutiable: true
        }
      ],
      Services: [
        {
          Code: "",
          Description: "",
          PDF: ""
        }
      ],
      Attachments: [
        {
          Type: "Invoice",
          Base64: "",
          FileType: "pdf"
        }
      ]
    };

    console.log('Nextera: Payload formaté:', JSON.stringify(payload, null, 2));
    console.log('Nextera: Envoi à l\'API...');

    try {
      const response = await axios.post(
        'https://shipping.traxis.app/external/api/shipments/booking',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': '167ff33ef0f14631924a213281a6b217'
          }
        }
      );

      console.log('Nextera: Réponse reçue:', JSON.stringify(response.data, null, 2));
      res.json({ 
        message: `Commande ${order.reference} envoyée à Nextera avec succès`,
        nexteraResponse: response.data
      });
    } catch (apiError) {
      console.error('Nextera: Erreur API:', apiError.response ? apiError.response.data : apiError.message);
      throw apiError;
    }
  } catch (error) {
    console.error('Nextera: Erreur détaillée:', error);
    res.status(500).json({
      message: 'Erreur lors de l\'envoi à Nextera',
      error: error.response ? error.response.data : error.message
    });
  }
};

// Routes
router.post('/ship', sendToNextera);
router.post('/send-to-nextera/:orderId', sendToNextera);

// Exporter le router et la fonction
module.exports = router;
module.exports.sendToNextera = sendToNextera; 