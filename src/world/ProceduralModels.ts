import * as THREE from 'three';

/**
 * Utility class for generating procedural 3D models
 * This replaces the need for external model files
 */
export class ProceduralModels {
  /**
   * Creates a procedural tree model
   * @returns THREE.Group containing the tree model
   */
  public static createTree(): THREE.Group {
    const tree = new THREE.Group();
    
    // Create trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.8,
      metalness: 0.2
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = 1;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    
    // Create foliage (multiple layers for more realistic look)
    const foliageMaterial = new THREE.MeshStandardMaterial({
      color: 0x2E8B57,
      roughness: 0.8,
      metalness: 0.1
    });
    
    // Bottom layer (wider)
    const foliage1 = new THREE.Mesh(
      new THREE.ConeGeometry(1.2, 1.5, 8),
      foliageMaterial
    );
    foliage1.position.y = 2;
    foliage1.castShadow = true;
    foliage1.receiveShadow = true;
    
    // Middle layer
    const foliage2 = new THREE.Mesh(
      new THREE.ConeGeometry(0.9, 1.5, 8),
      foliageMaterial
    );
    foliage2.position.y = 3;
    foliage2.castShadow = true;
    foliage2.receiveShadow = true;
    
    // Top layer (narrower)
    const foliage3 = new THREE.Mesh(
      new THREE.ConeGeometry(0.6, 1.5, 8),
      foliageMaterial
    );
    foliage3.position.y = 4;
    foliage3.castShadow = true;
    foliage3.receiveShadow = true;
    
    // Add all parts to the tree group
    tree.add(trunk);
    tree.add(foliage1);
    tree.add(foliage2);
    tree.add(foliage3);
    
    // Add some random rotation to make trees look different from each other
    tree.rotation.y = Math.random() * Math.PI * 2;
    
    return tree;
  }
  
  /**
   * Creates a procedural rock model
   * @returns THREE.Group containing the rock model
   */
  public static createRock(): THREE.Group {
    const rock = new THREE.Group();
    
    // Create main rock body using a modified dodecahedron
    const rockGeometry = new THREE.DodecahedronGeometry(1, 1);
    
    // Distort vertices to make it look more natural
    const vertices = rockGeometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i);
      const y = vertices.getY(i);
      const z = vertices.getZ(i);
      
      // Apply random displacement to each vertex
      vertices.setX(i, x + (Math.random() - 0.5) * 0.2);
      vertices.setY(i, y + (Math.random() - 0.5) * 0.2);
      vertices.setZ(i, z + (Math.random() - 0.5) * 0.2);
    }
    
    // Update normals after vertex modification
    rockGeometry.computeVertexNormals();
    
    const rockMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true
    });
    
    const rockMesh = new THREE.Mesh(rockGeometry, rockMaterial);
    rockMesh.castShadow = true;
    rockMesh.receiveShadow = true;
    
    // Add some smaller rocks around the main one
    for (let i = 0; i < 3; i++) {
      const smallRockGeometry = new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.3, 1);
      
      // Distort vertices
      const smallVertices = smallRockGeometry.attributes.position;
      for (let j = 0; j < smallVertices.count; j++) {
        const x = smallVertices.getX(j);
        const y = smallVertices.getY(j);
        const z = smallVertices.getZ(j);
        
        smallVertices.setX(j, x + (Math.random() - 0.5) * 0.2);
        smallVertices.setY(j, y + (Math.random() - 0.5) * 0.2);
        smallVertices.setZ(j, z + (Math.random() - 0.5) * 0.2);
      }
      
      smallRockGeometry.computeVertexNormals();
      
      const smallRockMaterial = new THREE.MeshStandardMaterial({
        color: 0x7a7a7a,
        roughness: 0.9,
        metalness: 0.1,
        flatShading: true
      });
      
      const smallRock = new THREE.Mesh(smallRockGeometry, smallRockMaterial);
      smallRock.position.set(
        (Math.random() - 0.5) * 1.2,
        -0.5 + Math.random() * 0.3,
        (Math.random() - 0.5) * 1.2
      );
      smallRock.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      smallRock.castShadow = true;
      smallRock.receiveShadow = true;
      
      rock.add(smallRock);
    }
    
    // Add main rock to the group
    rock.add(rockMesh);
    
    // Random rotation for variety
    rock.rotation.y = Math.random() * Math.PI * 2;
    
    return rock;
  }
  
  /**
   * Creates a procedural building model
   * @returns THREE.Group containing the building model
   */
  public static createBuilding(): THREE.Group {
    const building = new THREE.Group();
    
    // Randomize building properties
    const width = 2 + Math.random() * 2;
    const depth = 2 + Math.random() * 2;
    const height = 2 + Math.random() * 3;
    const stories = Math.floor(height);
    
    // Create main building structure
    const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
    const buildingMaterial = new THREE.MeshStandardMaterial({
      color: 0xCCCCCC,
      roughness: 0.7,
      metalness: 0.2
    });
    
    const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
    buildingMesh.position.y = height / 2;
    buildingMesh.castShadow = true;
    buildingMesh.receiveShadow = true;
    
    // Add roof
    const roofType = Math.floor(Math.random() * 3); // 0: flat, 1: pitched, 2: pyramid
    
    if (roofType === 0) {
      // Flat roof
      const roofGeometry = new THREE.BoxGeometry(width + 0.2, 0.2, depth + 0.2);
      const roofMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.8,
        metalness: 0.2
      });
      
      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.y = height + 0.1;
      roof.castShadow = true;
      roof.receiveShadow = true;
      
      building.add(roof);
    } else if (roofType === 1) {
      // Pitched roof
      const roofGeometry = new THREE.BoxGeometry(width + 0.2, 1, depth + 0.2);
      roofGeometry.translate(0, 0.5, 0);
      
      // Modify vertices to create pitched roof
      const vertices = roofGeometry.attributes.position;
      for (let i = 0; i < vertices.count; i++) {
        const y = vertices.getY(i);
        const x = vertices.getX(i);
        
        if (y > 0.9) {
          vertices.setY(i, y + 0.8 * (1 - Math.abs(x) / (width / 2 + 0.1)));
        }
      }
      
      roofGeometry.computeVertexNormals();
      
      const roofMaterial = new THREE.MeshStandardMaterial({
        color: 0x880000,
        roughness: 0.8,
        metalness: 0.2
      });
      
      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.y = height;
      roof.castShadow = true;
      roof.receiveShadow = true;
      
      building.add(roof);
    } else {
      // Pyramid roof
      const roofGeometry = new THREE.ConeGeometry(Math.sqrt(width * width + depth * depth) / 2, 1.5, 4);
      const roofMaterial = new THREE.MeshStandardMaterial({
        color: 0x880000,
        roughness: 0.8,
        metalness: 0.2
      });
      
      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.y = height + 0.75;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      roof.receiveShadow = true;
      
      building.add(roof);
    }
    
    // Add windows
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x87CEEB,
      roughness: 0.3,
      metalness: 0.8,
      emissive: 0x333333
    });
    
    // Add windows to each story
    for (let story = 0; story < stories; story++) {
      const storyHeight = height / stories;
      const storyY = storyHeight * (story + 0.5);
      
      // Windows on front and back
      for (let i = 0; i < 2; i++) {
        const windowsPerWall = Math.max(1, Math.floor(width / 1.2));
        const windowWidth = width / (windowsPerWall * 2);
        
        for (let w = 0; w < windowsPerWall; w++) {
          const windowGeometry = new THREE.BoxGeometry(windowWidth, storyHeight * 0.6, 0.1);
          const window = new THREE.Mesh(windowGeometry, windowMaterial);
          
          const xPos = (w - (windowsPerWall - 1) / 2) * (width / windowsPerWall);
          window.position.set(
            xPos,
            storyY,
            (i === 0 ? 1 : -1) * (depth / 2 + 0.05)
          );
          
          window.castShadow = false;
          window.receiveShadow = false;
          
          building.add(window);
        }
      }
      
      // Windows on sides
      for (let i = 0; i < 2; i++) {
        const windowsPerWall = Math.max(1, Math.floor(depth / 1.2));
        const windowWidth = depth / (windowsPerWall * 2);
        
        for (let w = 0; w < windowsPerWall; w++) {
          const windowGeometry = new THREE.BoxGeometry(0.1, storyHeight * 0.6, windowWidth);
          const window = new THREE.Mesh(windowGeometry, windowMaterial);
          
          const zPos = (w - (windowsPerWall - 1) / 2) * (depth / windowsPerWall);
          window.position.set(
            (i === 0 ? 1 : -1) * (width / 2 + 0.05),
            storyY,
            zPos
          );
          
          window.castShadow = false;
          window.receiveShadow = false;
          
          building.add(window);
        }
      }
    }
    
    // Add door
    const doorGeometry = new THREE.BoxGeometry(width / 4, height / stories * 0.8, 0.1);
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.8,
      metalness: 0.2
    });
    
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, height / stories * 0.4, depth / 2 + 0.05);
    door.castShadow = false;
    door.receiveShadow = true;
    
    building.add(door);
    
    // Add main building to the group
    building.add(buildingMesh);
    
    return building;
  }
}
