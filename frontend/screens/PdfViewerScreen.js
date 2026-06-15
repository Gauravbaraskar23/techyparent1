// import React, { useState, useEffect } from 'react';
// import { View, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
// import Pdf from 'react-native-pdf';

// export default function PdfViewerScreen({ route }) {
//   const { pdfUrl } = route.params;
//   const [loading, setLoading] = useState(true);

//   return (
//     <View style={styles.container}>
//       {loading && (
//         <ActivityIndicator size="large" color="#3b82f6" />
//       )}

//       <Pdf
//         source={{ uri: pdfUrl }}
//         onLoadComplete={() => setLoading(false)}
//         onError={(error) => console.log(error)}
//         style={styles.pdf}
//       />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   pdf: {
//     flex: 1,
//     width: Dimensions.get('window').width,
//   },
// });