
// import RNFS from 'react-native-fs';

// export const downloadPDF = async (url, fileName = "report.pdf") => {
//   try {
//     const localPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

//     const result = await RNFS.downloadFile({
//       fromUrl: url,
//       toFile: localPath,
//     }).promise;

//     console.log("Status:", result.statusCode);
//     console.log("Saved at:", localPath);

//     if (result.statusCode === 200) {
//       return localPath;
//     } else {
//       throw new Error("Download failed");
//     }
//   } catch (error) {
//     console.error("PDF download error:", error);
//     throw error;
//   }
// };
// import RNFS from 'react-native-fs';

// /**
//  * Download PDF from URL and save locally
//  * @param {string} url - PDF URL from backend
//  * @param {string} fileName - name of file (example: report.pdf)
//  * @returns {string} local file path
//  */

// export const downloadPDF = async (url, fileName = 'report.pdf') => {
//   try {
//     // 📁 Save inside app's document directory
//     const localPath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

//     const result = await RNFS.downloadFile({
//       fromUrl: url,
//       toFile: localPath,
//       background: true,
//       discretionary: true,
//     }).promise;

//     if (result.statusCode === 200) {
//       return localPath;
//     } else {
//       throw new Error(`Download failed with status ${result.statusCode}`);
//     }
//   } catch (error) {
//     console.error('PDF download error:', error);
//     throw error;
//   }
// };