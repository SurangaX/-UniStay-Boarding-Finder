export const SRI_LANKAN_UNIVERSITIES = [
  { id: 'uok', name: 'University of Kelaniya', shortName: 'Kelaniya', city: 'Kelaniya', lat: 6.9744, lng: 79.9161 },
  { id: 'uoc', name: 'University of Colombo', shortName: 'Colombo', city: 'Colombo 03', lat: 6.9000, lng: 79.8588 },
  { id: 'uom', name: 'University of Moratuwa', shortName: 'Moratuwa', city: 'Moratuwa', lat: 6.7969, lng: 79.9018 },
  { id: 'usjp', name: 'University of Sri Jayewardenepura', shortName: 'Jayewardenepura (USJ)', city: 'Nugegoda', lat: 6.8528, lng: 79.9036 },
  { id: 'uop', name: 'University of Peradeniya', shortName: 'Peradeniya', city: 'Peradeniya, Kandy', lat: 7.2549, lng: 80.5975 },
  { id: 'uor', name: 'University of Ruhuna', shortName: 'Ruhuna', city: 'Matara', lat: 5.9381, lng: 80.5762 },
  { id: 'uoj', name: 'University of Jaffna', shortName: 'Jaffna', city: 'Jaffna', lat: 9.6849, lng: 80.0219 },
  { id: 'rusl', name: 'Rajarata University of Sri Lanka', shortName: 'Rajarata', city: 'Mihintale', lat: 8.3588, lng: 80.5042 },
  { id: 'susl', name: 'Sabaragamuwa University of Sri Lanka', shortName: 'Sabaragamuwa', city: 'Belihuloya', lat: 6.7146, lng: 80.7872 },
  { id: 'wusl', name: 'Wayamba University of Sri Lanka', shortName: 'Wayamba', city: 'Kuliyapitiya', lat: 7.4691, lng: 80.0414 },
  { id: 'seusl', name: 'South Eastern University of Sri Lanka', shortName: 'South Eastern', city: 'Oluvil', lat: 7.2974, lng: 81.8504 },
  { id: 'esl', name: 'Eastern University, Sri Lanka', shortName: 'Eastern', city: 'Vantharumoolai, Batticaloa', lat: 7.7944, lng: 81.5794 },
  { id: 'uwu', name: 'Uva Wellassa University', shortName: 'Uva Wellassa', city: 'Badulla', lat: 6.9819, lng: 81.0763 },
  { id: 'uvpa', name: 'University of the Visual & Performing Arts', shortName: 'UVPA', city: 'Colombo 07', lat: 6.9114, lng: 79.8647 },
  { id: 'ou', name: 'The Open University of Sri Lanka', shortName: 'OUSL', city: 'Nawala', lat: 6.8833, lng: 79.8864 },
  { id: 'sliit', name: 'SLIIT (Sri Lanka Institute of Information Technology)', shortName: 'SLIIT Malabe', city: 'Malabe', lat: 6.9147, lng: 79.9729 },
  { id: 'kdu', name: 'General Sir John Kotelawala Defence University', shortName: 'KDU Ratmalana', city: 'Ratmalana', lat: 6.8188, lng: 79.8887 },
  { id: 'nsbm', name: 'NSBM Green University', shortName: 'NSBM', city: 'Pitipana, Homagama', lat: 6.8211, lng: 80.0416 },
  { id: 'iit', name: 'Informatics Institute of Technology (IIT)', shortName: 'IIT', city: 'Colombo 06', lat: 6.8722, lng: 79.8611 }
];

/**
 * Calculates straight-line distance in kilometers between two geo-coordinates
 * using the Haversine formula.
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10; // 1 decimal place
}
