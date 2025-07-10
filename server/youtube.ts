interface YouTubeVideoData {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: string;
  likeCount: string;
  commentCount: string;
  duration: string;
}

interface YouTubeChannelData {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: string;
  videoCount: string;
  viewCount: string;
  customUrl: string;
  publishedAt: string;
}

export class YouTubeService {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor() {
    if (!process.env.YOUTUBE_API_KEY) {
      throw new Error('YOUTUBE_API_KEY environment variable is required');
    }
    this.apiKey = process.env.YOUTUBE_API_KEY;
  }

  extractVideoId(url: string): string | null {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }

  async getVideoData(videoUrl: string): Promise<YouTubeVideoData | null> {
    const videoId = this.extractVideoId(videoUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${this.apiKey}`
      );

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return null;
      }

      const video = data.items[0];
      const snippet = video.snippet;
      const statistics = video.statistics;

      return {
        id: videoId,
        title: snippet.title,
        description: snippet.description,
        thumbnail: snippet.thumbnails.maxres?.url || snippet.thumbnails.high?.url || snippet.thumbnails.default.url,
        channelTitle: snippet.channelTitle,
        publishedAt: snippet.publishedAt,
        viewCount: statistics.viewCount || '0',
        likeCount: statistics.likeCount || '0',
        commentCount: statistics.commentCount || '0',
        duration: video.contentDetails.duration
      };
    } catch (error) {
      console.error('Error fetching YouTube data:', error);
      throw error;
    }
  }

  formatDuration(duration: string): string {
    // Convert ISO 8601 duration (PT4M13S) to readable format (4:13)
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return '0:00';

    const hours = match[1] ? parseInt(match[1].slice(0, -1)) : 0;
    const minutes = match[2] ? parseInt(match[2].slice(0, -1)) : 0;
    const seconds = match[3] ? parseInt(match[3].slice(0, -1)) : 0;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  async getChannelData(channelHandle: string): Promise<YouTubeChannelData | null> {
    try {
      // First, get channel ID from handle
      const searchResponse = await fetch(
        `${this.baseUrl}/search?part=snippet&type=channel&q=${channelHandle}&key=${this.apiKey}`
      );

      if (!searchResponse.ok) {
        throw new Error(`YouTube API error: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      
      if (!searchData.items || searchData.items.length === 0) {
        return null;
      }

      const channelId = searchData.items[0].id.channelId;

      // Get detailed channel information
      const channelResponse = await fetch(
        `${this.baseUrl}/channels?part=snippet,statistics&id=${channelId}&key=${this.apiKey}`
      );

      if (!channelResponse.ok) {
        throw new Error(`YouTube API error: ${channelResponse.status}`);
      }

      const channelData = await channelResponse.json();
      
      if (!channelData.items || channelData.items.length === 0) {
        return null;
      }

      const channel = channelData.items[0];
      
      return {
        id: channel.id,
        title: channel.snippet.title,
        description: channel.snippet.description,
        thumbnail: channel.snippet.thumbnails.high?.url || channel.snippet.thumbnails.default?.url,
        subscriberCount: channel.statistics.subscriberCount || '0',
        videoCount: channel.statistics.videoCount || '0',
        viewCount: channel.statistics.viewCount || '0',
        customUrl: channel.snippet.customUrl || '',
        publishedAt: channel.snippet.publishedAt,
      };
    } catch (error) {
      console.error('Error fetching YouTube channel data:', error);
      throw error;
    }
  }

  formatCount(count: string): string {
    const num = parseInt(count);
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  async getChannelVideos(channelId: string, maxResults: number = 10): Promise<YouTubeVideoData[]> {
    try {
      // Get channel's latest videos
      const searchResponse = await fetch(
        `${this.baseUrl}/search?part=snippet&channelId=${channelId}&order=date&type=video&maxResults=${maxResults}&key=${this.apiKey}`
      );

      if (!searchResponse.ok) {
        throw new Error(`YouTube API error: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      
      if (!searchData.items || searchData.items.length === 0) {
        return [];
      }

      // Get detailed video information for each video
      const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
      
      const videosResponse = await fetch(
        `${this.baseUrl}/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${this.apiKey}`
      );

      if (!videosResponse.ok) {
        throw new Error(`YouTube API error: ${videosResponse.status}`);
      }

      const videosData = await videosResponse.json();
      
      return videosData.items.map((video: any) => ({
        id: video.id,
        title: video.snippet.title,
        description: video.snippet.description,
        thumbnail: video.snippet.thumbnails.maxres?.url || video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default.url,
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        viewCount: video.statistics.viewCount || '0',
        likeCount: video.statistics.likeCount || '0',
        commentCount: video.statistics.commentCount || '0',
        duration: video.contentDetails.duration
      }));
    } catch (error) {
      console.error('Error fetching channel videos:', error);
      throw error;
    }
  }

  async getChannelIdFromHandle(handle: string): Promise<string | null> {
    try {
      const searchResponse = await fetch(
        `${this.baseUrl}/search?part=snippet&type=channel&q=${handle}&key=${this.apiKey}`
      );

      if (!searchResponse.ok) {
        throw new Error(`YouTube API error: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      
      if (!searchData.items || searchData.items.length === 0) {
        return null;
      }

      return searchData.items[0].id.channelId;
    } catch (error) {
      console.error('Error fetching channel ID:', error);
      return null;
    }
  }
}

export const youtubeService = new YouTubeService();