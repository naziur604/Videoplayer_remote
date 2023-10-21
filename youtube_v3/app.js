const express = require('express');
const axios = require('axios');
const app = express();
const port = 3001; // You can change this port if needed
const apiKey = 'AIzaSyCSW8QMhryVLlnkhVMpZvb5Q4K1r-cez1c'; // Replace with your actual YouTube API key

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/play', async (req, res) => {
  const videoUrl = req.body.videoUrl;
  const videoId = getVideoIdFromUrl(videoUrl);

  try {
    const videoDetails = await fetchVideoDetails(videoId);
    const videoTitle = videoDetails.snippet.title;

    res.send(`
      <h2>Playing: ${videoTitle}</h2>
      <iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
    `);
  } catch (error) {
    console.error(error);
    res.send('Error occurred. Please check the video URL and try again.');
  }
});

function getVideoIdFromUrl(url) {
  const urlParams = new URLSearchParams(new URL(url).search);
  return urlParams.get('v');
}

async function fetchVideoDetails(videoId) {
  const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
    params: {
      key: apiKey,
      part: 'snippet',
      id: videoId,
    },
  });
  return response.data.items[0];
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
