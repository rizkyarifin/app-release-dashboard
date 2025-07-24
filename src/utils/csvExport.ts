import type { Release } from '../types';

export function exportToCSV(releases: Release[], filename: string = 'releases-export.csv') {
  // Filter to only include name and version columns
  const csvData = releases.map(release => ({
    name: release.appName,
    version: release.version.replace(/^v/, '') // Remove 'v' prefix if present
  }));

  // Create CSV header
  const headers = ['name', 'version'];
  
  // Convert data to CSV format
  const csvContent = [
    headers.join(','),
    ...csvData.map(row => 
      headers.map(header => {
        const value = row[header as keyof typeof row];
        // Escape quotes and wrap in quotes if necessary
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}