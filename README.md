# 3D模型顶点检索器 / 3D Vertex Identifier

基于Web的3D模型查看器，可以点击顶点查看其索引号码。

A web-based 3D model viewer that lets you click on vertices to see their index numbers.

## 功能特点 / Features

**中文:**
- 加载 OBJ、STL 和 FBX 文件
- 点击任意顶点进行选择
- 实时查看顶点编号
- 旋转、缩放和平移模型
- 调整点的大小以提高可见性
- 一键清除所有选择

**English:**
- Load OBJ, STL, and FBX files
- Click on any vertex to select it
- See vertex numbers in real-time
- Rotate, zoom, and pan around models
- Adjust point size for better visibility
- Clear all selections with one click

<img width="1920" height="966" alt="image" src="https://github.com/user-attachments/assets/a8abfdad-db75-44c5-9672-5310189253db" />


## 快速开始 / Quick Start

### 使用 Docker（推荐）/ Using Docker (Recommended)

```bash
# 克隆仓库 / Clone the repository
git clone https://github.com/MotorBottle/3D-Vertex-Identifier.git
cd 3D-Vertex-Identifier/obj-point-identifier

# 运行开发版本 / Run development version
docker-compose --profile dev up

# 或运行生产版本 / Or run production version
docker-compose up
```

**应用将在以下地址可用 / The app will be available at:**
- 开发版 Development: http://localhost:5173
- 生产版 Production: http://localhost:4173

### 手动安装 / Manual Setup

```bash
# 安装依赖 / Install dependencies
npm install

# 运行开发服务器 / Run development server
npm run dev

# 构建生产版本 / Build for production
npm run build
npm run preview
```

## 使用方法 / How to Use

**中文:**
1. **加载模型**: 点击"选择文件"并选择 OBJ、STL 或 FBX 文件
2. **选择顶点**: 点击模型上的任意点来选择它
3. **查看编号**: 已选择的顶点编号会显示在左侧面板中
4. **导航操作**: 使用鼠标旋转、缩放和平移模型
5. **调整大小**: 使用点大小滑块使顶点更容易看见
6. **清除所有**: 点击"Clear All"移除所有选择

**English:**
1. **Load a Model**: Click "Choose File" and select an OBJ, STL, or FBX file
2. **Select Vertices**: Click on any point on the model to select it
3. **View Numbers**: Selected vertex numbers appear in the left panel
4. **Navigate**: Use mouse to rotate, zoom, and pan around the model
5. **Adjust Size**: Use the point size slider to make vertices easier to see
6. **Clear All**: Click "Clear All" to remove all selections

## 文件支持 / File Support

**中文:**
- **OBJ**: 包含顶点数据的 Wavefront OBJ 文件
- **STL**: STereoLithography 文件（ASCII 和二进制）
- **FBX**: Autodesk FBX 文件

**English:**
- **OBJ**: Wavefront OBJ files with vertex data
- **STL**: STereoLithography files (ASCII and binary)
- **FBX**: Autodesk FBX files

## 部署 / Deployment

### 静态托管 / Static Hosting

**中文:** 构建后，`dist` 文件夹包含可部署到任何Web服务器的所有静态文件。

**English:** After building, the `dist` folder contains all static files that can be deployed to any web server.

### Docker 生产部署 / Docker Production

```bash
docker-compose up
```

**中文:** 这将在端口 4173 上运行优化的生产版本。

**English:** This runs the optimized production build on port 4173.

## 技术栈 / Technology

- React + TypeScript
- Three.js for 3D rendering / Three.js 用于3D渲染
- Vite for building / Vite 用于构建
- Docker for deployment / Docker 用于部署

## 许可证 / License

MIT
