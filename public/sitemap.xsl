<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9">
  <xsl:template match="/">
    <html>
      <head>
        <title>eSIM2you sitemap</title>
        <style>
          body { font-family: system-ui, sans-serif; margin: 2rem; color: #10233f; }
          a { color: #0b49b7; }
          table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
          th, td { text-align: left; padding: 0.4rem 0.6rem; border-bottom: 1px solid #e4e8ef; }
        </style>
      </head>
      <body>
        <h1>eSIM2you sitemap</h1>
        <xsl:if test="s:sitemapindex">
          <p>This file lists the sitemap parts. Open each link to see the page URLs.</p>
          <ul>
            <xsl:for-each select="s:sitemapindex/s:sitemap">
              <li>
                <a href="{s:loc}"><xsl:value-of select="s:loc"/></a>
                <xsl:text> — </xsl:text>
                <xsl:value-of select="s:lastmod"/>
              </li>
            </xsl:for-each>
          </ul>
        </xsl:if>
        <xsl:if test="s:urlset">
          <p>Page URLs in this sitemap part.</p>
          <table>
            <tr><th>URL</th><th>Last modified</th></tr>
            <xsl:for-each select="s:urlset/s:url">
              <tr>
                <td><a href="{s:loc}"><xsl:value-of select="s:loc"/></a></td>
                <td><xsl:value-of select="s:lastmod"/></td>
              </tr>
            </xsl:for-each>
          </table>
        </xsl:if>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
