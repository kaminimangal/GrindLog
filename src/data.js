export const CATEGORIES = [
  { id: 'dsa',        label: 'DSA/LeetCode',       color: '#9333EA', short: 'DSA' },
  { id: 'sysdesign',  label: 'System Design',       color: '#3B82F6', short: 'SYS DESIGN' },
  { id: 'networking', label: 'Computer Networking', color: '#14B8A6', short: 'NETWORKING' },
  { id: 'ml',         label: 'ML & Math',           color: '#F59E0B', short: 'ML & MATH' },
  { id: 'books',      label: 'Books',               color: '#10B981', short: 'BOOKS' },
  { id: 'jobs',       label: 'Job Applications',    color: '#F97316', short: 'JOB APPS' },
  { id: 'cv',         label: 'CV/Resume',           color: '#EC4899', short: 'CV/RESUME' },
  { id: 'contests',   label: 'Contests',            color: '#EF4444', short: 'CONTESTS' },
  { id: 'office',     label: 'Office Work',         color: '#6B7280', short: 'OFFICE WORK' },
]

export const getCategoryById = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[0]

export const MOCK_TODAY_ENTRIES = [
  {
    id: 1,
    categoryId: 'dsa',
    note: 'Solved 2 Medium LeetCode problems on Dynamic Programming. Stopped at Problem #198.',
    time: '6:30 PM',
    minutes: 60,
  },
  {
    id: 2,
    categoryId: 'sysdesign',
    note: 'Studied Load Balancers and Rate Limiting. Need to review consistent hashing.',
    time: '4:15 PM',
    minutes: 45,
  },
  {
    id: 3,
    categoryId: 'office',
    note: 'Completed quarterly report and internal documentation.',
    time: '11:00 AM',
    minutes: 90,
  },
]

export const MOCK_LEFT_OFF = [
  {
    id: 1,
    categoryId: 'dsa',
    note: "Finished BFS/DFS problems on LeetCode. Need to review topological sort tomorrow and start on Dijkstra's optimization patterns.",
    timeAgo: 'Yesterday · 11:45 PM',
  },
  {
    id: 2,
    categoryId: 'sysdesign',
    note: 'Explored consistent hashing and database sharding techniques. Drafted a high-level architecture for a scalable notification system using Kafka.',
    timeAgo: '2 days ago · 09:30 AM',
  },
  {
    id: 3,
    categoryId: 'networking',
    note: 'Reviewed TCP/UDP headers and the 3-way handshake process. Looked into TLS 1.3 handshake optimizations.',
    timeAgo: 'Oct 24 · 03:15 PM',
  },
  {
    id: 4,
    categoryId: 'ml',
    note: 'Derived the backpropagation equations for a simple neural network. Stuck on the chain rule application for softmax activation.',
    timeAgo: 'Oct 23 · 08:20 PM',
  },
  {
    id: 5,
    categoryId: 'books',
    note: "Read Chapter 4 of 'Designing Data-Intensive Applications'. Focused on SSTables and LSM-Trees.",
    timeAgo: 'Oct 22 · 10:45 PM',
  },
  {
    id: 6,
    categoryId: 'jobs',
    note: 'Submitted application for Senior Backend Engineer at TechNova. Need to follow up with the referral on Friday.',
    timeAgo: 'Oct 21 · 02:00 PM',
  },
  {
    id: 7,
    categoryId: 'cv',
    note: 'Updated experience section with the new cloud migration project metrics. Reduced latency by 40% — emphasize this more.',
    timeAgo: 'Oct 20 · 11:15 AM',
  },
  {
    id: 8,
    categoryId: 'contests',
    note: 'Analyzed why I failed the 4th problem in LeetCode Weekly. Segment Tree implementation was too slow; need to learn lazy propagation.',
    timeAgo: 'Oct 19 · 10:00 PM',
  },
]
