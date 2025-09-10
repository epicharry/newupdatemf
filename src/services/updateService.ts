export interface UpdateInfo {
  version: string;
  releaseNotes: string;
  downloadUrl: string;
  exeDownloadUrl?: string;
  mandatory: boolean;
  releaseDate: string;
}

export interface UpdateStatus {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion?: string;
  updateInfo?: UpdateInfo;
}

export class UpdateService {
  private static readonly UPDATE_CHECK_URL = 'https://api.github.com/repos/epicharry/valradiant/releases/latest';
  private static readonly CURRENT_VERSION = '1.0.0'; // This should match your package.json version
  private static cachedUpdateInfo: UpdateStatus | null = null;
  private static lastCheck: number = 0;
  private static readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  static async checkForUpdates(forceCheck: boolean = false): Promise<UpdateStatus> {
    const now = Date.now();
    
    // Return cached status if still valid and not forcing check
    if (!forceCheck && this.cachedUpdateInfo && (now - this.lastCheck) < this.CACHE_DURATION) {
      return this.cachedUpdateInfo;
    }

    try {
      const response = await fetch(this.UPDATE_CHECK_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'ValRadiant-App/1.0.0'
        },
        cache: forceCheck ? 'no-cache' : 'default'
      });

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 403) {
          console.warn('GitHub API rate limited or access denied');
          // Return cached data if available, otherwise return no update
          if (this.cachedUpdateInfo) {
            return this.cachedUpdateInfo;
          }
          return {
            hasUpdate: false,
            currentVersion: this.CURRENT_VERSION
          };
        }
        
        if (response.status === 404) {
          console.warn('Repository not found or private');
          return {
            hasUpdate: false,
            currentVersion: this.CURRENT_VERSION
          };
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const releaseData = await response.json();
      const latestVersion = releaseData.tag_name.replace('v', ''); // Remove 'v' prefix if present
      const hasUpdate = this.compareVersions(this.CURRENT_VERSION, latestVersion) < 0;
      
      // Find the .exe asset in the release
      const exeAsset = releaseData.assets?.find((asset: any) => 
        asset.name.toLowerCase().endsWith('.exe')
      );

      const updateStatus: UpdateStatus = {
        hasUpdate,
        currentVersion: this.CURRENT_VERSION,
        latestVersion,
        updateInfo: hasUpdate ? {
          version: latestVersion,
          releaseNotes: releaseData.body || 'No release notes available.',
          downloadUrl: releaseData.html_url,
          exeDownloadUrl: exeAsset?.browser_download_url,
          mandatory: releaseData.name?.toLowerCase().includes('critical') || false,
          releaseDate: releaseData.published_at
        } : undefined
      };

      this.cachedUpdateInfo = updateStatus;
      this.lastCheck = now;
      
      return updateStatus;
    } catch (error) {
      console.warn('Failed to check for updates:', error);
      
      // Return cached data if available, otherwise return current version info
      if (this.cachedUpdateInfo && !forceCheck) {
        console.log('Using cached update info due to API error');
        return this.cachedUpdateInfo;
      }
      
      const fallbackStatus: UpdateStatus = {
        hasUpdate: false,
        currentVersion: this.CURRENT_VERSION
      };
      
      return fallbackStatus;
    }
  }

  private static compareVersions(current: string, latest: string): number {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);
    
    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const latestPart = latestParts[i] || 0;
      
      if (currentPart < latestPart) return -1;
      if (currentPart > latestPart) return 1;
    }
    
    return 0;
  }

  static async downloadUpdate(updateInfo: UpdateInfo): Promise<void> {
    // If we have a direct EXE download URL, try to download and launch it
    if (updateInfo.exeDownloadUrl) {
      try {
        await this.downloadAndLaunchUpdate(updateInfo);
        return;
      } catch (error) {
        console.error('Failed to download EXE directly, falling back to browser:', error);
      }
    }
    
    // Fallback to opening in browser
    try {
      const downloadUrl = updateInfo.exeDownloadUrl || updateInfo.downloadUrl;
      await (window as any).electronAPI?.openExternal?.(downloadUrl);
    } catch (error) {
      console.error('Failed to open download URL:', error);
      // Final fallback to window.open
      const downloadUrl = updateInfo.exeDownloadUrl || updateInfo.downloadUrl;
      window.open(downloadUrl, '_blank');
    }
  }

  static async downloadAndLaunchUpdate(updateInfo: UpdateInfo): Promise<void> {
    if (!updateInfo.exeDownloadUrl) {
      throw new Error('No direct download URL available');
    }

    try {
      // Create a temporary filename
      const fileName = `ValRadiant-v${updateInfo.version}.exe`;
      
      // Download the file using fetch
      const response = await fetch(updateInfo.exeDownloadUrl);
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(url);
      
      // For mandatory updates, we should close the app after download
      if (updateInfo.mandatory) {
        // Give user time to see the download complete
        setTimeout(() => {
          // Try to close the app via Electron API
          if ((window as any).electronAPI?.appQuit) {
            (window as any).electronAPI.appQuit();
          } else {
            // Fallback: show message to user
            alert('Update downloaded! Please close the app and run the downloaded installer.');
          }
        }, 2000);
      }
      
      console.log(`Downloaded ${fileName} successfully`);
      
    } catch (error) {
      console.error('Failed to download EXE:', error);
      throw error;
    }
  }

  static clearCache(): void {
    this.cachedUpdateInfo = null;
    this.lastCheck = 0;
  }

  static getCurrentVersion(): string {
    return this.CURRENT_VERSION;
  }
}