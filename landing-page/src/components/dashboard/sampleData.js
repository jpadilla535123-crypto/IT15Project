function daysFromNow(n) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + n)
  return d
}

export const clients = [
  { Id: 1, CompanyName: 'Heritage Bank PH', ContactPerson: 'Grace Martinez', Email: 'grace@heritagebank.ph', Phone: '+63 921 555 0105', Address: 'Ortigas, Pasig', ClientType: 'Corporate', Status: 'Booked', Source: 'Referral', DateOfInquiry: daysFromNow(-45), Events: 3, Budget: 250000 },
  { Id: 2, CompanyName: 'Garcia Family', ContactPerson: 'Miguel Garcia', Email: 'miguel.garcia@gmail.com', Phone: '+63 920 555 0104', Address: 'Muntinlupa', ClientType: 'Private', Status: 'Booked', Source: 'Walk-in', DateOfInquiry: daysFromNow(-60), Events: 1, Budget: 150000 },
  { Id: 3, CompanyName: 'Luna Events Co.', ContactPerson: 'Ana Santos', Email: 'ana@lunaevents.ph', Phone: '+63 919 555 0103', Address: 'Quezon City', ClientType: 'Corporate', Status: 'New', Source: 'Website', DateOfInquiry: daysFromNow(-20), Events: 4, Budget: 320000 },
  { Id: 4, CompanyName: 'BlueSky Tech', ContactPerson: 'Maria Cruz', Email: 'maria@bluesky.tech', Phone: '+63 918 555 0102', Address: 'BGC, Taguig', ClientType: 'Corporate', Status: 'Completed', Source: 'LinkedIn', DateOfInquiry: daysFromNow(-120), Events: 2, Budget: 400000 },
  { Id: 5, CompanyName: 'Acme Corporation', ContactPerson: 'John Reyes', Email: 'john@acme.com', Phone: '+63 917 555 0101', Address: 'Ayala Ave, Makati', ClientType: 'Corporate', Status: 'New', Source: 'Facebook', DateOfInquiry: daysFromNow(-10), Events: 5, Budget: 500000 },
]

export const employees = [
  { Id: 1, FirstName: 'Daniel', LastName: 'Rivera', Role: 'Event Manager', Email: 'daniel.rivera@eventsphere.ph', Status: 'Active' },
  { Id: 2, FirstName: 'Sophia', LastName: 'Mercado', Role: 'Event Coordinator', Email: 'sophia.mercado@eventsphere.ph', Status: 'Active' },
  { Id: 3, FirstName: 'James', LastName: 'Tolentino', Role: 'AV Technician', Email: 'james.tolentino@eventsphere.ph', Status: 'Active' },
  { Id: 4, FirstName: 'Ella', LastName: 'Bautista', Role: 'Designer', Email: 'ella.bautista@eventsphere.ph', Status: 'Active' },
  { Id: 5, FirstName: 'Nathan', LastName: 'Lopez', Role: 'Operations Staff', Email: 'nathan.lopez@eventsphere.ph', Status: 'Active' },
]

export const venues = [
  { Id: 1, Name: 'Acme Tower Hall', Address: 'Ortigas, Pasig', City: 'Manila', Capacity: 250, PricePerDay: 50000, ContactPerson: 'Rico Alonzo' },
  { Id: 2, Name: 'Coral Bay Pavilion', Address: 'Boracay', City: 'Aklan', Capacity: 150, PricePerDay: 45000, ContactPerson: 'Liza Manalo' },
  { Id: 3, Name: 'Metro Convention Center', Address: 'BGC', City: 'Taguig', Capacity: 400, PricePerDay: 80000, ContactPerson: 'Paolo Dizon' },
  { Id: 4, Name: 'The Glasshouse', Address: 'Forbes Park', City: 'Makati', Capacity: 120, PricePerDay: 35000, ContactPerson: 'Cathy Reyes' },
  { Id: 5, Name: 'Skyline Rooftop', Address: 'Poblacion', City: 'Makati', Capacity: 300, PricePerDay: 60000, ContactPerson: 'Ian Cruz' },
]

export const events = [
  { Id: 1, Name: 'Acme Annual Meeting', EventType: 'Corporate', Status: 'Booked', ClientId: 1, VenueId: 1, StartDate: daysFromNow(0), EndDate: daysFromNow(0), StartTime: '09:00', EndTime: '12:00', Guests: 120, SpecialRequirements: '' },
  { Id: 2, Name: 'Garcia Wedding Reception', EventType: 'Wedding', Status: 'Booked', ClientId: 3, VenueId: 2, StartDate: daysFromNow(0), EndDate: daysFromNow(0), StartTime: '13:00', EndTime: '18:00', Guests: 180, SpecialRequirements: 'Buffet for 180 guests' },
  { Id: 3, Name: 'Heritage Customer Appreciation', EventType: 'Corporate', Status: 'New', ClientId: 1, VenueId: 3, StartDate: daysFromNow(0), EndDate: daysFromNow(0), StartTime: '19:00', EndTime: '22:00', Guests: 200, SpecialRequirements: '' },
  { Id: 4, Name: 'Luna Product Launch', EventType: 'Product Launch', Status: 'New', ClientId: 3, VenueId: 4, StartDate: daysFromNow(3), EndDate: daysFromNow(3), StartTime: '18:00', EndTime: '22:00', Guests: 150, SpecialRequirements: 'AV for presentation' },
  { Id: 5, Name: 'BlueSky Tech Summit', EventType: 'Conference', Status: 'Completed', ClientId: 5, VenueId: 5, StartDate: daysFromNow(-20), EndDate: daysFromNow(-19), StartTime: '08:00', EndTime: '17:00', Guests: 320, SpecialRequirements: '' },
  { Id: 6, Name: 'Corporate Annual Meeting', EventType: 'Corporate', Status: 'Booked', ClientId: 2, VenueId: 3, StartDate: new Date(2026, 7, 30), EndDate: new Date(2026, 7, 30), StartTime: '09:00', EndTime: '17:00', Guests: 250, SpecialRequirements: 'Live streaming' },
  { Id: 7, Name: 'Tech Seminar', EventType: 'Seminar', Status: 'Pending', ClientId: 4, VenueId: 1, StartDate: new Date(2026, 7, 19), EndDate: new Date(2026, 7, 19), StartTime: '10:00', EndTime: '15:00', Guests: 60, SpecialRequirements: '' },
  { Id: 8, Name: 'Debut Party', EventType: 'Debut', Status: 'Pending', ClientId: 2, VenueId: 5, StartDate: new Date(2026, 7, 22), EndDate: new Date(2026, 7, 22), StartTime: '19:00', EndTime: '23:00', Guests: 200, SpecialRequirements: 'Photo booth' },
  { Id: 9, Name: 'Private Anniversary Dinner', EventType: 'Private Event', Status: 'Completed', ClientId: 2, VenueId: 4, StartDate: new Date(2026, 7, 14), EndDate: new Date(2026, 7, 14), StartTime: '19:00', EndTime: '22:00', Guests: 40, SpecialRequirements: '' },
  { Id: 10, Name: 'Wedding Reception', EventType: 'Wedding', Status: 'Booked', ClientId: 1, VenueId: 2, StartDate: new Date(2026, 8, 5), EndDate: new Date(2026, 8, 5), StartTime: '13:00', EndTime: '18:00', Guests: 180, SpecialRequirements: '' },
  { Id: 11, Name: 'Product Launch', EventType: 'Product Launch', Status: 'New', ClientId: 1, VenueId: 3, StartDate: new Date(2026, 8, 12), EndDate: new Date(2026, 8, 12), StartTime: '18:00', EndTime: '22:00', Guests: 150, SpecialRequirements: '' },
  { Id: 12, Name: 'Birthday Celebration', EventType: 'Birthday', Status: 'Completed', ClientId: 3, VenueId: 5, StartDate: new Date(2026, 8, 20), EndDate: new Date(2026, 8, 20), StartTime: '19:00', EndTime: '22:00', Guests: 100, SpecialRequirements: '' },
]

export const leads = [
  { Id: 1, CompanyName: 'Heritage Bank PH', ContactName: 'Grace Martinez', Email: 'grace@heritagebank.ph', Phone: '+63 917 555 0111', Source: 'Referral', EventType: 'Corporate Anniversary', EstimatedBudget: 450000, Status: 'New', CreatedDate: daysFromNow(-2) },
  { Id: 2, CompanyName: 'Garcia Family', ContactName: 'Miguel Garcia', Email: 'miguel.garcia@gmail.com', Phone: '+63 918 555 0112', Source: 'Walk-in', EventType: 'Wedding', EstimatedBudget: 250000, Status: 'Contacted', CreatedDate: daysFromNow(-8) },
  { Id: 3, CompanyName: 'Luna Events Co.', ContactName: 'Ana Santos', Email: 'ana@lunaevents.ph', Phone: '+63 919 555 0113', Source: 'Website', EventType: 'Product Launch', EstimatedBudget: 600000, Status: 'Confirmed Appointment', CreatedDate: daysFromNow(-15) },
  { Id: 4, CompanyName: 'BlueSky Tech', ContactName: 'Maria Cruz', Email: 'maria@bluesky.tech', Phone: '+63 920 555 0114', Source: 'LinkedIn', EventType: 'Conference', EstimatedBudget: 800000, Status: 'New', CreatedDate: daysFromNow(-1) },
  { Id: 5, CompanyName: 'Novacorp Retail', ContactName: 'Kevin Tan', Email: 'kevin@novacorp.ph', Phone: '+63 921 555 0115', Source: 'Website', EventType: 'Store Opening', EstimatedBudget: 400000, Status: 'Lost', CreatedDate: daysFromNow(-5) },
]

export const dashboardData = { clients, employees, venues, events, leads }