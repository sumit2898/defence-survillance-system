import * as L from 'leaflet';

declare module 'leaflet' {
    export function heatLayer(
        latlngs: Array<[number, number] | [number, number, number]>,
        options?: HeatLayerOptions
    ): HeatLayer;

    export interface HeatLayerOptions {
        minOpacity?: number;
        maxZoom?: number;
        max?: number;
        radius?: number;
        blur?: number;
        gradient?: { [key: number]: string };
    }

    export interface HeatLayer extends Layer {
        setOptions(options: HeatLayerOptions): this;
        addLatLng(latlng: LatLng | [number, number] | [number, number, number]): this;
        setLatLngs(latlngs: Array<[number, number] | [number, number, number]>): this;
    }
}
