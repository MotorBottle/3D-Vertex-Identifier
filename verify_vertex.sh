#!/bin/bash

# Script to find vertex coordinates in OBJ file
# Usage: ./verify_vertex.sh x y z

if [ $# -ne 3 ]; then
    echo "Usage: $0 x y z"
    echo "Example: $0 0.052507 1.651059 0.072679"
    exit 1
fi

X=$1
Y=$2
Z=$3

echo "Searching for vertex with coordinates: x=$X, y=$Y, z=$Z"
echo "=================================================="

# Search for the exact coordinates (allowing for small floating point differences)
FOUND=false
grep -n "^v " "smplx_0060.obj" | while read line; do
    LINE_NUM=$(echo "$line" | cut -d: -f1)
    COORDS=$(echo "$line" | cut -d: -f2 | cut -d' ' -f2-4)
    
    # Extract x, y, z
    VX=$(echo "$COORDS" | awk '{print $1}')
    VY=$(echo "$COORDS" | awk '{print $2}')
    VZ=$(echo "$COORDS" | awk '{print $3}')
    
    # Check if coordinates match (with tolerance)
    if awk -v x1="$X" -v x2="$VX" -v y1="$Y" -v y2="$VY" -v z1="$Z" -v z2="$VZ" '
        function abs(x) { return x < 0 ? -x : x }
        BEGIN { 
            if (abs(x1-x2) < 0.00001 && abs(y1-y2) < 0.00001 && abs(z1-z2) < 0.00001) 
                exit 0; 
            else 
                exit 1 
        }'; then
        VERTEX_NUM=$((LINE_NUM - 2))  # Line number minus header line (line 1)
        echo "🎯 MATCH FOUND!"
        echo "OBJ file line: $LINE_NUM"
        echo "OBJ vertex number (0-based): $VERTEX_NUM"
        echo "OBJ vertex number (1-based): $((VERTEX_NUM + 1))"
        echo "Coordinates: x=$VX, y=$VY, z=$VZ"
        echo "Difference: x=$(awk "BEGIN {print $X - $VX}"), y=$(awk "BEGIN {print $Y - $VY}"), z=$(awk "BEGIN {print $Z - $VZ}")"
        FOUND=true
        break
    fi
done

if [ "$FOUND" = false ]; then
    echo "❌ No exact match found. Trying broader search..."
    echo "Closest matches:"
    awk -v target_x="$X" -v target_y="$Y" -v target_z="$Z" '
    /^v / {
        x = $2; y = $3; z = $4
        dist = sqrt((target_x-x)^2 + (target_y-y)^2 + (target_z-z)^2)
        if (dist < 0.01) {
            printf "Line %d: distance=%.6f, coords=(%.8f, %.8f, %.8f)\n", NR, dist, x, y, z
        }
    }' "smplx_0060.obj" | head -5
fi

echo "=================================================="