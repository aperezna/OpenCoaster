var React = require('react');
var { View } = require('react-native');

// Mock for testing — WebView renders as a plain View
var WebView = React.forwardRef(function (props, ref) {
  // Only pass style and testID from the WebView's outer props
  return React.createElement(View, { style: props.style });
});

WebView.displayName = 'WebView';

module.exports = { WebView: WebView };
