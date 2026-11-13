<?php
/**
 * pasha.by/poland: the page is drawn in its own shell, without the theme header and footer.
 *
 * Applies only to the page with the slug "poland". Output: a short header with the site link
 * (the block turns it into a random phrase), the page content, a footer.
 * wp_head() and wp_footer() stay, so plugins (stats, admin bar) keep working.
 * Theme stylesheets and scripts are not loaded on this page.
 *
 * Install: Code Snippets → Add New → PHP, paste without the opening "<?php" line, "Run snippet everywhere", Save and Activate.
 * To switch back to the theme template, deactivate the snippet.
 */
if ( ! defined( 'ABSPATH' ) ) {
	return;
}

function pashaby_poland_shell_on() {
	return ! is_admin() && is_page( 'poland' );
}

add_action( 'wp_enqueue_scripts', function () {
	if ( ! pashaby_poland_shell_on() ) {
		return;
	}
	$dirs = array_unique( array( get_template_directory_uri(), get_stylesheet_directory_uri() ) );
	foreach ( array( wp_styles(), wp_scripts() ) as $deps ) {
		foreach ( (array) $deps->queue as $handle ) {
			$src = isset( $deps->registered[ $handle ] ) ? (string) $deps->registered[ $handle ]->src : '';
			foreach ( $dirs as $dir ) {
				if ( '' !== $src && 0 === strpos( $src, $dir ) ) {
					if ( $deps instanceof WP_Scripts ) {
						wp_dequeue_script( $handle );
					} else {
						wp_dequeue_style( $handle );
					}
				}
			}
		}
	}
}, 100 );

add_action( 'template_redirect', function () {
	if ( ! pashaby_poland_shell_on() ) {
		return;
	}
	$post = get_queried_object();
	if ( ! ( $post instanceof WP_Post ) || post_password_required( $post ) ) {
		return;
	}
	$GLOBALS['post'] = $post;
	setup_postdata( $post );
	$home = esc_url( home_url( '/' ) );
	/* the page's own icon (media 5603, 5604, 5605) instead of the site icon */
	$pl_icons = array();
	foreach ( array( array( 'icon', '32x32', 5603 ), array( 'icon', '192x192', 5604 ), array( 'apple-touch-icon', '180x180', 5605 ) ) as $pl_i ) {
		$pl_u = wp_get_attachment_url( $pl_i[2] );
		if ( $pl_u ) {
			$pl_icons[] = sprintf( '<link rel="%s" type="image/png" sizes="%s" href="%s">', esc_attr( $pl_i[0] ), esc_attr( $pl_i[1] ), esc_url( $pl_u ) );
		}
	}
	if ( $pl_icons ) {
		remove_action( 'wp_head', 'wp_site_icon', 99 );
	}
	?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<?php echo implode( "\n", $pl_icons ) . "\n"; wp_head(); ?>
<style id="pashaby-poland-shell">
html,body{margin:0;padding:0;background:#fff;color:#141414}
body{font-family:'Nunito Sans',system-ui,-apple-system,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased}
.pl-shell-h{display:flex;align-items:center;justify-content:flex-start;gap:12px;padding-block:clamp(20px,2.4vw,36px);padding-left:max(clamp(20px,4.45vw,112px),env(safe-area-inset-left,0px));padding-right:max(clamp(20px,4.45vw,112px),env(safe-area-inset-right,0px))}
.pl-shell-h a{color:#141414;text-decoration:none;font-weight:700;font-size:20px;letter-spacing:-.04em}
.pl-shell-f{padding:40px 20px;text-align:center;border-top:1px solid #ddd}
.pl-shell-f a{color:#141414;text-decoration:none;font-weight:700;letter-spacing:-.04em}
.pl{width:auto!important;max-width:none!important;margin-left:0!important}
body.admin-bar .pl{--pl-top:var(--wp-admin--admin-bar--height,32px)}
@media (max-width:600px){body.admin-bar .pl{--pl-top:0px}}
</style>
</head>
<body <?php body_class( 'pl-shell' ); ?>>
<?php
	if ( function_exists( 'wp_body_open' ) ) {
		wp_body_open();
	}
	?>
<header class="pl-shell-h"><a href="<?php echo $home; ?>" data-pl-logo>pasha.by</a></header>
<main id="main"><?php echo apply_filters( 'the_content', $post->post_content ); ?></main>
<footer class="pl-shell-f"><a href="<?php echo $home; ?>">pasha.by</a></footer>
<?php wp_footer(); ?>
</body>
</html>
<?php
	exit;
} );
