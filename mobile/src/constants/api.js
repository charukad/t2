// Base URLs for different environments
export const DEV_API_URL = 'http://localhost:5008/api'; // Using localhost only
// Other options to try if above doesn't work:
// 'http://192.168.0.102:5008/api' - Direct IP (current setting)
// 'http://localhost:5008/api' - iOS simulator 
// 'http://127.0.0.1:5008/api' - iOS simulator alternative

export const STAGING_API_URL = 'https://staging-api.srilankaguide.com/api';
export const PROD_API_URL = 'https://api.srilankaguide.com/api';

// Select API URL based on environment and platform
import { Platform } from 'react-native';

// Update to use your local machine's IP address
export const API_URL = Platform.select({
  ios: 'http://localhost:5008/api',  // For iOS simulator
  android: 'http://10.0.2.2:5008/api', // For Android emulator
  default: 'http://127.0.0.1:5008/api', // Try direct localhost IP
});

// Helper for development to test different server URLs
export const getApiUrl = (host = null) => {
  if (!__DEV__ || !host) return API_URL;
  return `http://${host}:5008/api`;
};

// API endpoints organized by feature
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    REFRESH_TOKEN: '/auth/refresh-token',
    ME: '/auth/me',
  },
  
  // Profile endpoints
  PROFILE: {
    UPLOAD_IMAGE: '/profile/image',
    GET_IMAGES: '/profile/images',
    DELETE_IMAGE: (id) => `/profile/image/${id}`,
    PROFILE_IMAGE_BY_EMAIL: (email) => `/profile-images/by-email/${encodeURIComponent(email)}`,
  },
  
  // User endpoints
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    UPLOAD_AVATAR: '/users/avatar',
    CHANGE_PASSWORD: '/users/change-password',
    GET_BY_ID: (id) => `/users/${id}`,
    FOLLOW: (id) => `/users/${id}/follow`,
    UNFOLLOW: (id) => `/users/${id}/unfollow`,
    FOLLOWERS: (id) => `/users/${id}/followers`,
    FOLLOWING: (id) => `/users/${id}/following`,
    PROFILE_IMAGE: (email) => `/users/profile-image/${encodeURIComponent(email)}`,
  },
  
  // Tourist endpoints
  TOURISTS: {
    PROFILE: '/tourists/profile',
    PREFERENCES: '/tourists/preferences',
  },
  
  // Guide endpoints
  GUIDES: {
    LIST: '/guides',
    DETAILS: (id) => `/guides/${id}`,
    AVAILABILITY: (id) => `/guides/${id}/availability`,
    REVIEWS: (id) => `/guides/${id}/reviews`,
    SERVICES: (id) => `/guides/${id}/services`,
    FEATURED: '/guides/featured',
    VERIFY: (id) => `/guides/${id}/verify`,
    PORTFOLIO: (id) => `/guides/${id}/portfolio`,
    PROFILE: '/guides/profile',
  },
  
  // Vehicle owner endpoints
  VEHICLE_OWNERS: {
    PROFILE: '/vehicle-owners/profile',
    VEHICLES: '/vehicles/owner',
    VERIFY: (id) => `/vehicle-owners/${id}/verify`,
  },
  
  // Vehicle endpoints
  VEHICLES: {
    LIST: '/vehicles',
    DETAILS: (id) => `/vehicles/${id}`,
    AVAILABILITY: (id) => `/vehicles/${id}/availability`,
    REVIEWS: (id) => `/vehicles/${id}/reviews`,
    SEARCH: '/vehicles/search',
    CATEGORIES: '/vehicles/categories',
    VERIFY: (id) => `/vehicles/${id}/verify`,
  },
  
  // Location endpoints
  LOCATIONS: {
    LIST: '/locations',
    DETAILS: (id) => `/locations/${id}`,
    NEARBY: '/locations/nearby',
    SEARCH: '/locations/search',
    CATEGORIES: '/locations/categories',
    FEATURED: '/locations/featured',
    REVIEWS: (id) => `/locations/${id}/reviews`,
    PHOTOS: (id) => `/locations/${id}/photos`,
    PANORAMIC: (id) => `/locations/${id}/panoramic`,
  },
  
  // Itinerary endpoints
  ITINERARIES: {
    LIST: '/itineraries',
    DETAILS: (id) => `/itineraries/${id}`,
    CREATE: '/itineraries',
    UPDATE: (id) => `/itineraries/${id}`,
    DELETE: (id) => `/itineraries/${id}`,
    ITEMS: (id) => `/itineraries/${id}/items`,
    ITEM_DETAILS: (itineraryId, itemId) => `/itineraries/${itineraryId}/items/${itemId}`,
    ADD_ITEM: (id) => `/itineraries/${id}/items`,
    UPDATE_ITEM: (itineraryId, itemId) => `/itineraries/${itineraryId}/items/${itemId}`,
    DELETE_ITEM: (itineraryId, itemId) => `/itineraries/${itineraryId}/items/${itemId}`,
    CALCULATE_ROUTE: (id) => `/itineraries/${id}/calculate-route`,
    DAILY_SUMMARY: (id) => `/itineraries/${id}/daily-summary`,
    COLLABORATORS: (id) => `/itineraries/${id}/collaborators`,
    PUBLIC: '/itineraries/public',
    SHARE: (id) => `/itineraries/${id}/share`,
    ADD_EVENT: (itineraryId, eventId) => `/itineraries/${itineraryId}/events/${eventId}`,
  },
  
  // Booking endpoints
  BOOKINGS: {
    GUIDE: {
      LIST: '/bookings/guides',
      CREATE: '/bookings/guides',
      DETAILS: (id) => `/bookings/guides/${id}`,
      CANCEL: (id) => `/bookings/guides/${id}/cancel`,
      UPDATE: (id) => `/bookings/guides/${id}`,
      CONFIRM: (id) => `/bookings/guides/${id}/confirm`,
    },
    VEHICLE: {
      LIST: '/bookings/vehicles',
      CREATE: '/bookings/vehicles',
      DETAILS: (id) => `/bookings/vehicles/${id}`,
      CANCEL: (id) => `/bookings/vehicles/${id}/cancel`,
      UPDATE: (id) => `/bookings/vehicles/${id}`,
      CONFIRM: (id) => `/bookings/vehicles/${id}/confirm`,
    },
  },
  
  // Social feed endpoints
  SOCIAL: {
    POSTS: {
      LIST: '/posts',
      FEED: '/posts/feed',
      FEATURED: '/posts/featured',
      TRENDING: '/posts/trending',
      NEARBY: '/posts/nearby',
      CREATE: '/posts',
      DETAILS: (id) => `/posts/${id}`,
      UPDATE: (id) => `/posts/${id}`,
      DELETE: (id) => `/posts/${id}`,
      LIKE: (id) => `/posts/${id}/like`,
      SAVE: (id) => `/posts/${id}/save`,
      COMMENTS: (id) => `/posts/${id}/comments`,
      COMMENT: (postId, commentId) => `/posts/${postId}/comments/${commentId}`,
      LIKE_COMMENT: (postId, commentId) => `/posts/${postId}/comments/${commentId}/like`,
      REPLY: (postId, commentId) => `/posts/${postId}/comments/${commentId}/replies`,
    },
    USER_POSTS: (userId) => `/users/${userId}/posts`,
    LOCATION_POSTS: (locationId) => `/locations/${locationId}/posts`,
    SAVED_POSTS: '/posts/saved',
    HASHTAGS: {
      TRENDING: '/hashtags/trending',
      SEARCH: '/hashtags/search',
      POSTS: (tag) => `/hashtags/${tag}/posts`,
    },
  },
  
  // Event endpoints
  EVENTS: {
    LIST: '/events',
    DETAILS: (id) => `/events/${id}`,
    FEATURED: '/events/featured',
    NEARBY: '/events/nearby',
    UPCOMING: '/events/upcoming',
    ONGOING: '/events/ongoing',
    PAST: '/events/past',
    THIS_MONTH: '/events/this-month',
    CATEGORIES: '/events/categories',
    BY_DATE: '/events/date',
    DATES: '/events/dates',
    SAVE: (id) => `/events/${id}/save`,
    SAVED: '/events/saved',
    SEARCH: '/events/search',
    CALENDAR: '/events/calendar',
    UPCOMING_RANGE: '/events/upcoming-range',
  },
  
  // Cultural information endpoints
  CULTURAL_INFO: {
    LIST: '/cultural-info',
    DETAILS: (id) => `/cultural-info/${id}`,
    CATEGORIES: '/cultural-info/categories',
    SEARCH: '/cultural-info/search',
    FEATURED: '/cultural-info/featured',
    RELATED_EVENTS: (id) => `/cultural-info/${id}/events`,
    ETIQUETTE: '/cultural-info/etiquette',
    CUSTOMS: '/cultural-info/customs',
    RELIGIONS: '/cultural-info/religions',
    FESTIVALS: '/cultural-info/festivals',
    CUISINE: '/cultural-info/cuisine',
  },
  
  // Notification endpoints
  NOTIFICATIONS: {
    LIST: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    MARK_READ: (id) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    SETTINGS: '/notifications/settings',
    SUBSCRIBE: '/notifications/subscribe',
    UNSUBSCRIBE: '/notifications/unsubscribe',
  },
  
  // Messaging endpoints
  MESSAGES: {
    CONVERSATIONS: '/messages/conversations',
    CONVERSATION_MESSAGES: (id) => `/messages/conversations/${id}`,
    SEND: '/messages',
    MARK_READ: (id) => `/messages/${id}/read`,
    DELETE: (id) => `/messages/${id}`,
    UNREAD_COUNT: '/messages/unread-count',
  },
  
  // Review endpoints
  REVIEWS: {
    CREATE: '/reviews',
    UPDATE: (id) => `/reviews/${id}`,
    DELETE: (id) => `/reviews/${id}`,
    USER_REVIEWS: (userId) => `/users/${userId}/reviews`,
    HELPFUL: (id) => `/reviews/${id}/helpful`,
  },
  
  // Payment endpoints
  PAYMENTS: {
    METHODS: '/payments/methods',
    ADD_METHOD: '/payments/methods',
    DELETE_METHOD: (id) => `/payments/methods/${id}`,
    PROCESS: '/payments/process',
    HISTORY: '/payments/history',
    TRANSACTION: (id) => `/payments/transactions/${id}`,
    REFUND: (id) => `/payments/transactions/${id}/refund`,
  },
  
  // Weather and alerts endpoints
  ALERTS: {
    WEATHER: '/alerts/weather',
    SAFETY: '/alerts/safety',
    TRANSPORTATION: '/alerts/transportation',
    SUBSCRIBE: '/alerts/subscribe',
    UNSUBSCRIBE: '/alerts/unsubscribe',
  },
};

export default API_ENDPOINTS;