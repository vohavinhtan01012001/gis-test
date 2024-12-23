'use client';

import * as L from 'leaflet';
import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import shpjs from 'shpjs';
import vt from './vt';

function useShapefileDrop(setGeojson, setMessage, setMessageColor, popup) {
	useEffect(() => {
		window.ondragover = e => e.preventDefault();
		window.ondrop = async e => {
			e.preventDefault();
			try {
				setMessage('Loading data...');
				setMessageColor('blue');
				popup.current.showModal();

				const file = e.dataTransfer.files[0];
				if (!file.name.endsWith('.zip')) {
					throw new Error('Only .zip files are supported.');
				}

				const geojson = await shpjs(await file.arrayBuffer());
				setGeojson(geojson);
				popup.current.close();
			} catch (error) {
				setMessage(error.message);
				setMessageColor('red');
			} finally {
				setTimeout(() => popup.current.close(), 5000);
			}
		};
	}, [setGeojson, setMessage, setMessageColor, popup]);
}

export default function MapCanvas() {
	const [geojson, setGeojson] = useState(undefined);
	const popup = useRef();
	const [message, setMessage] = useState(undefined);
	const [messageColor, setMessageColor] = useState('blue');

	useShapefileDrop(setGeojson, setMessage, setMessageColor, popup);

	return (
		<div>
			<dialog ref={popup} style={{ color: messageColor }}>
				{message}
				<button onClick={() => popup.current.close()} style={{ marginLeft: '10px' }}>
					Close
				</button>
			</dialog>
			<MapContainer id="map" center={{ lat: 0, lng: 120 }} zoom={5} maxZoom={17} minZoom={5}>
				<GeoJSONTile data={geojson} />
				<TileLayer
					url="http://mt0.google.com/vt/lyrs=m&hl=en&x={x}&y={y}&z={z}"
					attribution="Google Map"
				/>
			</MapContainer>
		</div>
	);
}

function GeoJSONTile({ data, maxZoom = 17, minZoom = 5, tolerance = 5, style = { color: '#0000ff', fillColor: '#0000ff4d', weight: 1 } }) {
	const container = useMap();

	useEffect(() => {
		if (data) {
			const bounds = L.geoJSON(data).getBounds();
			container.fitBounds(bounds);

			const optionsVector = {
				maxZoom: 24,
				minZoom: 0,
				maxNativeZoom: maxZoom,
				minNativeZoom: minZoom,
				tolerance,
				style,
			};

			// Tạo lớp từ GeoJSON và thêm vào bản đồ
			const tileLayer = new L.GeoJSON.VT(data, optionsVector);
			container.addLayer(tileLayer);

			return () => {
				container.removeLayer(tileLayer);
			};
		}
	}, [data]);

	return null;
}
