-- Seed data for delivery routes
-- This creates realistic delivery routes for testing in Brisbane, Australia

INSERT INTO delivery_routes (id, user_id, route_name, route_data, created_at, updated_at) VALUES
(
  1,
  1, -- driver@dropflow.com
  'Brisbane CBD Morning Run',
  '{
    "stops": [
      {
        "id": "stop_1",
        "rawAddress": "123 Queen St, Brisbane City QLD 4000",
        "customerName": "Brisbane Office Supplies",
        "phone": "+61 7 3000 1001",
        "notes": "Loading dock at rear, ring buzzer 3",
        "timeWindow": "9:00 AM - 11:00 AM",
        "geo": {
          "lat": -27.4705,
          "lng": 153.0260,
          "formattedAddress": "123 Queen Street, Brisbane City QLD 4000, Australia"
        }
      },
      {
        "id": "stop_2", 
        "rawAddress": "456 Adelaide St, Brisbane City QLD 4000",
        "customerName": "City Legal Partners",
        "phone": "+61 7 3000 1002",
        "notes": "Documents for Sarah Chen, Level 12",
        "timeWindow": "10:00 AM - 12:00 PM",
        "geo": {
          "lat": -27.4689,
          "lng": 153.0271,
          "formattedAddress": "456 Adelaide Street, Brisbane City QLD 4000, Australia"
        }
      },
      {
        "id": "stop_3",
        "rawAddress": "789 Ann St, Fortitude Valley QLD 4006", 
        "customerName": "Valley Tech Hub",
        "phone": "+61 7 3000 1003",
        "notes": "IT equipment delivery, handle with care",
        "timeWindow": "11:30 AM - 1:30 PM",
        "geo": {
          "lat": -27.4598,
          "lng": 153.0356,
          "formattedAddress": "789 Ann Street, Fortitude Valley QLD 4006, Australia"
        }
      }
    ],
    "optimization": {
      "totalDistance": 8.7,
      "totalTime": 45,
      "fuelCost": 4.35,
      "optimizedOrder": [0, 1, 2]
    },
    "vehicle": {
      "type": "van",
      "fuelType": "petrol",
      "lPer100": 8.5,
      "fuelPrice": 1.89
    }
  }',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
),
(
  2,
  1, -- driver@dropflow.com
  'South Brisbane Afternoon Run',
  '{
    "stops": [
      {
        "id": "stop_1",
        "rawAddress": "321 Grey St, South Brisbane QLD 4101",
        "customerName": "Riverside Cafe",
        "phone": "+61 7 3000 2001",
        "notes": "Fresh produce delivery, use side entrance",
        "timeWindow": "2:00 PM - 4:00 PM",
        "geo": {
          "lat": -27.4833,
          "lng": 153.0167,
          "formattedAddress": "321 Grey Street, South Brisbane QLD 4101, Australia"
        }
      },
      {
        "id": "stop_2",
        "rawAddress": "654 Melbourne St, South Brisbane QLD 4101", 
        "customerName": "Cultural Centre Gallery",
        "phone": "+61 7 3000 2002",
        "notes": "Art supplies, fragile items",
        "timeWindow": "3:00 PM - 5:00 PM",
        "geo": {
          "lat": -27.4838,
          "lng": 153.0172,
          "formattedAddress": "654 Melbourne Street, South Brisbane QLD 4101, Australia"
        }
      },
      {
        "id": "stop_3",
        "rawAddress": "147 Stanley St, South Brisbane QLD 4101",
        "customerName": "Stanley Medical Centre",
        "phone": "+61 7 3000 2003", 
        "notes": "Medical supplies, urgent delivery",
        "timeWindow": "1:00 PM - 3:00 PM",
        "geo": {
          "lat": -27.4856,
          "lng": 153.0189,
          "formattedAddress": "147 Stanley Street, South Brisbane QLD 4101, Australia"
        }
      },
      {
        "id": "stop_4",
        "rawAddress": "258 Vulture St, South Brisbane QLD 4101",
        "customerName": "Vulture Street Markets",
        "phone": "+61 7 3000 2004",
        "notes": "Market stall supplies, loading zone available",
        "timeWindow": "4:00 PM - 6:00 PM",
        "geo": {
          "lat": -27.4878,
          "lng": 153.0201,
          "formattedAddress": "258 Vulture Street, South Brisbane QLD 4101, Australia"
        }
      }
    ],
    "optimization": {
      "totalDistance": 6.2,
      "totalTime": 38,
      "fuelCost": 3.10,
      "optimizedOrder": [2, 0, 1, 3]
    },
    "vehicle": {
      "type": "van",
      "fuelType": "petrol", 
      "lPer100": 8.5,
      "fuelPrice": 1.89
    }
  }',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
),
(
  3,
  2, -- admin@dropflow.com (Pro user)
  'North Side Industrial Route',
  '{
    "stops": [
      {
        "id": "stop_1",
        "rawAddress": "15 Breakfast Creek Rd, Newstead QLD 4006",
        "customerName": "Newstead Manufacturing",
        "phone": "+61 7 3000 3001",
        "notes": "Industrial parts delivery, dock 3",
        "timeWindow": "8:00 AM - 10:00 AM",
        "geo": {
          "lat": -27.4412,
          "lng": 153.0453,
          "formattedAddress": "15 Breakfast Creek Road, Newstead QLD 4006, Australia"
        }
      },
      {
        "id": "stop_2",
        "rawAddress": "87 Kingsford Smith Dr, Hamilton QLD 4007",
        "customerName": "Hamilton Port Logistics",
        "phone": "+61 7 3000 3002",
        "notes": "Container parts, forklift required",
        "timeWindow": "9:00 AM - 11:00 AM", 
        "geo": {
          "lat": -27.4389,
          "lng": 153.0567,
          "formattedAddress": "87 Kingsford Smith Drive, Hamilton QLD 4007, Australia"
        }
      },
      {
        "id": "stop_3",
        "rawAddress": "234 Sandgate Rd, Albion QLD 4010",
        "customerName": "Albion Auto Parts",
        "phone": "+61 7 3000 3003",
        "notes": "Automotive components, check quality control tags",
        "timeWindow": "10:30 AM - 12:30 PM",
        "geo": {
          "lat": -27.4278,
          "lng": 153.0398,
          "formattedAddress": "234 Sandgate Road, Albion QLD 4010, Australia"
        }
      },
      {
        "id": "stop_4",
        "rawAddress": "456 Gympie Rd, Strathpine QLD 4500",
        "customerName": "North Pine Industrial",
        "phone": "+61 7 3000 3004",
        "notes": "Heavy machinery parts, crane access needed",
        "timeWindow": "11:00 AM - 1:00 PM",
        "geo": {
          "lat": -27.3067,
          "lng": 152.9889,
          "formattedAddress": "456 Gympie Road, Strathpine QLD 4500, Australia"
        }
      },
      {
        "id": "stop_5",
        "rawAddress": "789 Old Northern Rd, Bray Park QLD 4500",
        "customerName": "Bray Park Warehouse",
        "phone": "+61 7 3000 3005",
        "notes": "Bulk storage items, multiple trips may be required",
        "timeWindow": "12:00 PM - 2:00 PM",
        "geo": {
          "lat": -27.2845,
          "lng": 152.9778,
          "formattedAddress": "789 Old Northern Road, Bray Park QLD 4500, Australia"
        }
      },
      {
        "id": "stop_6",
        "rawAddress": "101 Anzac Ave, Redcliffe QLD 4020",
        "customerName": "Redcliffe Marine Supplies",
        "phone": "+61 7 3000 3006", 
        "notes": "Marine equipment, waterproof packaging",
        "timeWindow": "1:30 PM - 3:30 PM",
        "geo": {
          "lat": -27.2312,
          "lng": 153.1067,
          "formattedAddress": "101 Anzac Avenue, Redcliffe QLD 4020, Australia"
        }
      }
    ],
    "optimization": {
      "totalDistance": 47.8,
      "totalTime": 142,
      "fuelCost": 18.95,
      "optimizedOrder": [0, 1, 2, 3, 4, 5]
    },
    "vehicle": {
      "type": "truck",
      "fuelType": "diesel",
      "lPer100": 12.5,
      "fuelPrice": 1.67
    }
  }',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
),
(
  4,
  3, -- pro.driver@dropflow.com (Pro yearly user)
  'Gold Coast Express Route',
  '{
    "stops": [
      {
        "id": "stop_1",
        "rawAddress": "50 Cavill Ave, Surfers Paradise QLD 4217",
        "customerName": "Surfers Paradise Hotel",
        "phone": "+61 7 5000 4001",
        "notes": "Hotel supplies, service elevator access",
        "timeWindow": "7:00 AM - 9:00 AM",
        "geo": {
          "lat": -27.9983,
          "lng": 153.4301,
          "formattedAddress": "50 Cavill Avenue, Surfers Paradise QLD 4217, Australia"
        }
      },
      {
        "id": "stop_2",
        "rawAddress": "123 Gold Coast Hwy, Broadbeach QLD 4218",
        "customerName": "Broadbeach Convention Centre",
        "phone": "+61 7 5000 4002",
        "notes": "Event supplies for conference, loading dock B",
        "timeWindow": "8:30 AM - 10:30 AM",
        "geo": {
          "lat": -28.0289,
          "lng": 153.4312,
          "formattedAddress": "123 Gold Coast Highway, Broadbeach QLD 4218, Australia"
        }
      },
      {
        "id": "stop_3",
        "rawAddress": "789 Southport-Nerang Rd, Southport QLD 4215",
        "customerName": "Southport Medical Precinct",
        "phone": "+61 7 5000 4003",
        "notes": "Medical equipment, temperature controlled",
        "timeWindow": "9:00 AM - 11:00 AM",
        "geo": {
          "lat": -27.9614,
          "lng": 153.3889,
          "formattedAddress": "789 Southport-Nerang Road, Southport QLD 4215, Australia"
        }
      },
      {
        "id": "stop_4",
        "rawAddress": "456 Pacific Hwy, Helensvale QLD 4212",
        "customerName": "Helensvale Shopping Centre",
        "phone": "+61 7 5000 4004",
        "notes": "Retail stock delivery, use service entrance",
        "timeWindow": "10:00 AM - 12:00 PM",
        "geo": {
          "lat": -27.9067,
          "lng": 153.3467,
          "formattedAddress": "456 Pacific Highway, Helensvale QLD 4212, Australia"
        }
      },
      {
        "id": "stop_5",
        "rawAddress": "234 Bermuda St, Mermaid Beach QLD 4218", 
        "customerName": "Beachside Apartments",
        "phone": "+61 7 5000 4005",
        "notes": "Apartment complex supplies, multiple buildings",
        "timeWindow": "11:30 AM - 1:30 PM",
        "geo": {
          "lat": -28.0456,
          "lng": 153.4389,
          "formattedAddress": "234 Bermuda Street, Mermaid Beach QLD 4218, Australia"
        }
      }
    ],
    "optimization": {
      "totalDistance": 28.4,
      "totalTime": 87,
      "fuelCost": 11.25,
      "optimizedOrder": [2, 3, 0, 1, 4]
    },
    "vehicle": {
      "type": "van",
      "fuelType": "petrol",
      "lPer100": 9.2,
      "fuelPrice": 1.91
    }
  }',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
),
(
  5,
  4, -- newbie@dropflow.com
  'First Delivery Route',
  '{
    "stops": [
      {
        "id": "stop_1",
        "rawAddress": "100 Adelaide St, Brisbane City QLD 4000",
        "customerName": "City Bookstore",
        "phone": "+61 7 3000 5001",
        "notes": "Book delivery, ground floor",
        "timeWindow": "10:00 AM - 12:00 PM",
        "geo": {
          "lat": -27.4694,
          "lng": 153.0264,
          "formattedAddress": "100 Adelaide Street, Brisbane City QLD 4000, Australia"
        }
      },
      {
        "id": "stop_2",
        "rawAddress": "200 Edward St, Brisbane City QLD 4000",
        "customerName": "Edward Street Pharmacy",
        "phone": "+61 7 3000 5002",
        "notes": "Pharmaceutical supplies, secure delivery",
        "timeWindow": "11:00 AM - 1:00 PM",
        "geo": {
          "lat": -27.4683,
          "lng": 153.0289,
          "formattedAddress": "200 Edward Street, Brisbane City QLD 4000, Australia"
        }
      }
    ],
    "optimization": {
      "totalDistance": 1.2,
      "totalTime": 15,
      "fuelCost": 0.95,
      "optimizedOrder": [0, 1]
    },
    "vehicle": {
      "type": "car",
      "fuelType": "petrol",
      "lPer100": 7.8,
      "fuelPrice": 1.89
    }
  }',
  NOW() - INTERVAL '1 hour',
  NOW() - INTERVAL '1 hour'
);

-- Set the sequence to continue from the highest ID
SELECT setval('delivery_routes_id_seq', (SELECT MAX(id) FROM delivery_routes));
