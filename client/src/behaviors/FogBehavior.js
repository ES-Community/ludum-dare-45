// Require Internal Dependencies
const THREE = require("three");

const FogBehavior = {
    createOrUpdate(mask = [
        1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 0, 1, 1, 1, 1,
        1, 1, 0, 0, 0, 1, 1, 1,
        1, 0, 0, 0, 0, 0, 1, 1,
        1, 1, 0, 0, 0, 1, 1, 1
    ]) {
        //create a typed array to hold texture data
        const data = new Uint8Array(mask.length);
        //copy mask into the typed array
        data.set(mask.map(v => v * 255));
        //create the texture
        const texture = new THREE.DataTexture(data, 8, 8, THREE.LuminanceFormat, THREE.UnsignedByteType);

        texture.flipY = true;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        //it's likely that our texture will not have "power of two" size, meaning that mipmaps are not going to be supported on WebGL 1.0, so let's turn them off
        texture.generateMipmaps = false;

        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearFilter;

        const geometry = new THREE.PlaneBufferGeometry(100, 100, 1, 1);
        const material = new THREE.MeshBasicMaterial({
            color: "black",
            alphaMap: texture,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 1
        });

        // construct a mesh
        const plane = new THREE.Mesh(geometry, material);

        plane.position.y = 1;
        plane.rotation.x = 55;
        return plane;
    }

}



module.exports = FogBehavior;