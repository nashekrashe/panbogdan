<?php
/**
 * pasha.by/poland moved to panbogdan.com: canonical points to the new site.
 * Code Snippets: Add New, PHP, "Run snippet everywhere", Save and Activate.
 */
add_filter( 'get_canonical_url', function ( $url, $post ) {
	return ( $post instanceof WP_Post && 'poland' === $post->post_name ) ? 'https://panbogdan.com/' : $url;
}, 10, 2 );
