const token =
  'bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE2MDkwMzk5OTMsImV4cCI6MTkyNDYxNTk5MywiaXNzIjoiYmFja2V5OikiLCJzdWIiOiJiYWNrbWluIn0.DVrE1X3ujx_FlO--Q5115GT0CWwfpIvwhnrvkgyTkOs';

const TOKEN_PATTERN = /^bearer\s+([\w.=-]+)\w*$/i;

console.log(TOKEN_PATTERN.test(token));
