/** Remove upstream demonstration credentials at build time, not just at runtime. */
/* global module */
module.exports = function stripCesiumDemoToken(source) {
  const declaration = /const defaultAccessToken\s*=\s*"[^"\r\n]+";/g;
  if ([...source.matchAll(declaration)].length !== 1) {
    throw new Error(
      "Cesium Ion module changed; review demo-token removal before building",
    );
  }
  return source.replace(declaration, 'const defaultAccessToken = "";');
};
