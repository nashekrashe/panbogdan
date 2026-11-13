<?php
/**
 * pasha.by/poland: fuel prices for Poland.
 *
 * Source: European Commission, Weekly Oil Bulletin, "Prices with taxes, latest prices" (EUR per 1000 l).
 * Converted to PLN with the NBP table A EUR mid rate on the bulletin date (or the last one before it).
 *
 * GET /wp-json/pashaby/v1/fuel  →  { date, pb95, on, lpg, rate, rate_date, source }
 * Cached for 12 hours. If a refresh fails, the last good value is served.
 *
 * Install: Code Snippets → Add New → PHP, paste without the opening "<?php" line if the plugin adds it, "Run snippet everywhere", Save and Activate.
 */
if ( ! defined( 'ABSPATH' ) ) {
	return;
}

add_action( 'rest_api_init', function () {
	register_rest_route( 'pashaby/v1', '/fuel', array(
		'methods'             => 'GET',
		'permission_callback' => '__return_true',
		'callback'            => 'pashaby_fuel_rest',
	) );
} );

function pashaby_fuel_rest() {
	$data = get_transient( 'pashaby_fuel' );
	if ( false === $data ) {
		$fresh = pashaby_fuel_fetch();
		if ( $fresh ) {
			update_option( 'pashaby_fuel_last', $fresh, false );
			set_transient( 'pashaby_fuel', $fresh, 12 * HOUR_IN_SECONDS );
			$data = $fresh;
		} else {
			$data = get_option( 'pashaby_fuel_last', array() );
			set_transient( 'pashaby_fuel', $data, HOUR_IN_SECONDS ); // retry in an hour
		}
	}
	if ( empty( $data ) ) {
		return new WP_REST_Response( array( 'error' => 'unavailable' ), 503 );
	}
	$res = new WP_REST_Response( $data, 200 );
	$res->header( 'Cache-Control', 'public, max-age=3600' );
	return $res;
}

function pashaby_fuel_fetch() {
	if ( ! class_exists( 'ZipArchive' ) ) {
		return null;
	}
	$r = wp_remote_get( 'https://energy.ec.europa.eu/document/download/264c2d0f-f161-4ea3-a777-78faae59bea0_en', array( 'timeout' => 20 ) );
	if ( is_wp_error( $r ) || 200 !== (int) wp_remote_retrieve_response_code( $r ) ) {
		return null;
	}
	$tmp = tempnam( get_temp_dir(), 'pbwob' );
	if ( ! $tmp ) {
		return null;
	}
	file_put_contents( $tmp, wp_remote_retrieve_body( $r ) );
	$zip = new ZipArchive();
	if ( true !== $zip->open( $tmp ) ) {
		@unlink( $tmp );
		return null;
	}
	$sheet = $zip->getFromName( 'xl/worksheets/sheet1.xml' );
	$ss    = $zip->getFromName( 'xl/sharedStrings.xml' );
	$zip->close();
	@unlink( $tmp );
	if ( ! $sheet ) {
		return null;
	}

	$prev    = libxml_use_internal_errors( true );
	$strings = array();
	if ( $ss ) {
		$sx = simplexml_load_string( $ss );
		if ( $sx ) {
			foreach ( $sx->si as $si ) {
				$t = isset( $si->t ) ? (string) $si->t : '';
				if ( '' === $t && isset( $si->r ) ) {
					foreach ( $si->r as $run ) {
						$t .= (string) $run->t;
					}
				}
				$strings[] = $t;
			}
		}
	}
	$x = simplexml_load_string( $sheet );
	libxml_use_internal_errors( $prev );
	if ( ! $x || ! isset( $x->sheetData ) ) {
		return null;
	}

	$rows = array();
	foreach ( $x->sheetData->row as $row ) {
		$cells = array();
		foreach ( $row->c as $c ) {
			$col = preg_replace( '/\d+/', '', (string) $c['r'] );
			$v   = isset( $c->v ) ? (string) $c->v : '';
			if ( 's' === (string) $c['t'] && '' !== $v ) {
				$v = isset( $strings[ (int) $v ] ) ? $strings[ (int) $v ] : '';
			}
			$cells[ $col ] = $v;
		}
		$rows[] = $cells;
	}
	if ( count( $rows ) < 3 ) {
		return null;
	}

	// Row 1: "in EUR" and the product names. Row 2: the price date (Excel serial) and units.
	$head = $rows[0];
	if ( ! isset( $head['A'] ) || false === stripos( $head['A'], 'EUR' ) ) {
		return null;
	}
	$cols = array();
	foreach ( $head as $col => $title ) {
		if ( false !== stripos( $title, 'Euro-super 95' ) ) {
			$cols['pb95'] = $col;
		} elseif ( false !== stripos( $title, 'Automotive gas oil' ) ) {
			$cols['on'] = $col;
		} elseif ( false !== stripos( $title, 'LPG' ) ) {
			$cols['lpg'] = $col;
		}
	}
	if ( empty( $cols['pb95'] ) || empty( $cols['on'] ) ) {
		return null;
	}
	$serial = isset( $rows[1]['A'] ) ? (float) $rows[1]['A'] : 0;
	if ( $serial < 40000 ) {
		return null;
	}
	$date = gmdate( 'Y-m-d', (int) round( ( $serial - 25569 ) * 86400 ) );

	$pl = null;
	foreach ( $rows as $cells ) {
		if ( isset( $cells['A'] ) && 'poland' === strtolower( trim( $cells['A'] ) ) ) {
			$pl = $cells;
			break;
		}
	}
	if ( ! $pl ) {
		return null;
	}

	// NBP: EUR mid rate on the bulletin date or the last working day before it.
	$from = gmdate( 'Y-m-d', strtotime( $date . ' -7 days' ) );
	$n    = wp_remote_get( 'https://api.nbp.pl/api/exchangerates/rates/a/eur/' . $from . '/' . $date . '/?format=json', array(
		'timeout' => 10,
		'headers' => array( 'Accept' => 'application/json' ),
	) );
	if ( is_wp_error( $n ) || 200 !== (int) wp_remote_retrieve_response_code( $n ) ) {
		return null;
	}
	$nj = json_decode( wp_remote_retrieve_body( $n ), true );
	if ( empty( $nj['rates'] ) || ! is_array( $nj['rates'] ) ) {
		return null;
	}
	$last = end( $nj['rates'] );
	$rate = isset( $last['mid'] ) ? (float) $last['mid'] : 0;
	if ( $rate < 3 || $rate > 6 ) {
		return null;
	}

	$out = array(
		'date'      => $date,
		'rate'      => $rate,
		'rate_date' => isset( $last['effectiveDate'] ) ? $last['effectiveDate'] : $date,
		'source'    => 'European Commission, Weekly Oil Bulletin; NBP',
	);
	foreach ( array( 'pb95', 'on', 'lpg' ) as $k ) {
		$eur       = ( isset( $cols[ $k ] ) && isset( $pl[ $cols[ $k ] ] ) ) ? (float) $pl[ $cols[ $k ] ] : 0;
		$out[ $k ] = $eur > 0 ? round( $eur / 1000 * $rate, 2 ) : null;
	}
	if ( ! $out['pb95'] || $out['pb95'] < 3 || $out['pb95'] > 15 ) {
		return null;
	}
	return $out;
}
