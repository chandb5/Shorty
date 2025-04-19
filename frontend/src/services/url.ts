import api from './api';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export interface ShortenUrlRequest {
  url: string;
}

export interface ShortenUrlResponse {
  data: {
    id: string;
    slug: string;
    url: string;
    user_id: string;
  };
  message: string;
}

export interface UrlData {
  id: string;
  slug: string;
  url: string;
  user_id: string;
}

export interface GetUrlsResponse {
  short_urls: UrlData[];
}

export interface UpdateUrlRequest {
  slug: string;
  updated_url: string;
}

export interface DeleteUrlRequest {
  slug: string;
}

export interface VisitData {
  id: string;
  shortened_url_id: string;
  visit_time: string;
}

export interface GetVisitsResponse {
  visits: VisitData[];
}

export const urlService = {
  async shortenUrl(request: ShortenUrlRequest): Promise<ShortenUrlResponse> {
    // Use direct axios without withCredentials for the API Gateway endpoint
    const token = localStorage.getItem('access_token');
    const response = await axios.post<ShortenUrlResponse>(`${API_BASE_URL}/shorten/`, request, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      // Explicitly disable withCredentials
      withCredentials: false
    });
    return response.data;
  },
  
  async getUserUrls(): Promise<GetUrlsResponse> {
    // Use direct axios without withCredentials for the API Gateway endpoint
    const token = localStorage.getItem('access_token');
    const response = await axios.get<GetUrlsResponse>(`${API_BASE_URL}/shorten/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      // Explicitly disable withCredentials
      withCredentials: false
    });
    return response.data;
  },
  
  async updateUrl(request: UpdateUrlRequest): Promise<ShortenUrlResponse> {
    const token = localStorage.getItem('access_token');
    const response = await axios.put<ShortenUrlResponse>(`${API_BASE_URL}/shorten/`, request, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      withCredentials: false
    });
    return response.data;
  },
  
  async deleteUrl(slug: string): Promise<any> {
    const token = localStorage.getItem('access_token');
    const response = await axios.delete(`${API_BASE_URL}/shorten/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: { slug },
      withCredentials: false
    });
    return response.data;
  },
  
  async getAllVisits(): Promise<GetVisitsResponse> {
    const token = localStorage.getItem('access_token');
    const response = await axios.get<GetVisitsResponse>(`${API_BASE_URL}/shorten/visits/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      withCredentials: false
    });
    return response.data;
  },
  
  async getUrlVisits(slug: string): Promise<GetVisitsResponse> {
    const token = localStorage.getItem('access_token');
    const response = await axios.get<GetVisitsResponse>(`${API_BASE_URL}/shorten/visits/${slug}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      withCredentials: false
    });
    return response.data;
  },
  
  formatShortUrl(slug: string): string {
    const baseUrl = API_BASE_URL.replace(/\/$/, '');
    return `${baseUrl}/${slug}`;
  }
};

export default urlService;
