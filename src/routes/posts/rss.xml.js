import gql from 'graphql-tag'
import ApolloClient from 'apollo-boost'

export async function get(req, res) {
  res.writeHead(200, {
    'Cache-Control': `max-age=0, s-max-age=${600}`, // 10 minutes
    'Content-Type': 'application/rss+xml',
  })

  const baseUrl = req ? `http://${req.headers['host']}` : ''
  res.end(await generate(baseUrl))
}

async function generate(baseUrl) {
  const client = new ApolloClient({
    fetch: require('node-fetch'),
    uri: baseUrl + '/graphql',
  })

  const response = await client.query({
    query: gql`
      query {
        posts(published: true) {
          html(htmlEntities: true)
          metadata {
            title
            description
            slug
            date
          }
        }
      }
    `,
  })

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" version="2.0">
<channel>
<title><![CDATA[ Tim Deschryver's Posts ]]></title>
<description><![CDATA[ Posts written by Tim Deschryver ]]></description>
<link>https://timdeschryver.dev/posts</link>
<image>
  <url>https://timdeschryver.dev/favicons/favicon-32x32.png</url>
  <title>Tim Deschryver's Posts</title>
  <link>https://timdeschryver.dev/posts</link>
</image>
${response.data.posts
  .map(
    post => `
      <item>
        <title><![CDATA[ ${post.metadata.title} ]]></title>
        <description><![CDATA[ ${post.metadata.description} ]]></description>
        <link>https://timdeschryver.dev/posts/${post.metadata.slug}</link>
        <pubDate>${post.metadata.date}</pubDate>
        <content:encoded>${post.html}></content:encoded>
      </item>
    `,
  )
  .join('\n')}
</channel>
</rss>`
}