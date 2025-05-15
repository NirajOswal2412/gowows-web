import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AskKB = () => {
  const [folderTree, setFolderTree] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [selectedPdf, setSelectedPdf] = useState(null);

  useEffect(() => {
    fetchRootFolders();
  }, []);

  const fetchRootFolders = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:7860/list-kb-folders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Root folderTree fetched:', response.data);
      setFolderTree(response.data);
    } catch (error) {
      console.error('❌ Error fetching root folders:', error);
    }
  };

  const handleFolderClick = async (folderPath) => {
    const isExpanded = expandedFolders[folderPath];
    console.log('📁 Folder clicked:', folderPath);

    if (isExpanded) {
      console.log('🔼 Collapsing folder:', folderPath);
      setExpandedFolders(prev => ({ ...prev, [folderPath]: false }));
    } else {
      console.log('🔄 Expanding folder:', folderPath);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`http://localhost:7860/list-kb-folder?folder=${encodeURIComponent(folderPath)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`📬 API response for ${folderPath}`, response.data);

        setExpandedFolders(prev => ({
          ...prev,
          [folderPath]: response.data
        }));
      } catch (error) {
        console.error(`❌ Error expanding folder ${folderPath}:`, error);
      }
    }
  };

  const renderTree = (nodes, level = 0, basePath = '') => {
    if (!Array.isArray(nodes)) return null;

    console.log(`📦 Rendering tree at level ${level} with nodes:`, nodes);

    return nodes.map((node) => {
      const name = node.folder || node.name;
      const fullPath = basePath ? `${basePath}/${name}` : name;

      // ✅ Detect folder by either type or presence of subfolders
      const isFolder = node.type === 'folder' || !!node.subfolders;
      const isExpanded = !!expandedFolders[fullPath];

      console.log(`🔍 Rendering node: ${fullPath}, Path: ${fullPath}, Expanded? ${isExpanded}`);

      return (
        <div key={fullPath} style={{ paddingLeft: `${level * 20}px`, cursor: isFolder ? 'pointer' : 'default' }}>
          {isFolder ? (
            <div onClick={() => handleFolderClick(fullPath)}>
              {isExpanded ? '🔽' : '▶️'} {name}{node.pdf_count !== undefined ? ` (${node.pdf_count} PDFs)` : ''}
            </div>
          ) : (
            <div onClick={() => setSelectedPdf(fullPath)}>
              📄 {name}
            </div>
          )}

          {isFolder && isExpanded && Array.isArray(expandedFolders[fullPath]) && (
            <div>
              {renderTree(expandedFolders[fullPath], level + 1, fullPath)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 80px)' }}>
      <div style={{ width: '30%', borderRight: '1px solid #ccc', padding: '20px' }}>
        <h3>📁 KB Folders</h3>
        {renderTree(folderTree)}
      </div>
      <div style={{ width: '70%', padding: '20px' }}>
        <h2>Ask Knowledge Base</h2>
        <p><strong>Selected PDF:</strong> {selectedPdf || 'None'}</p>
        <div className="chat-box">💬 Chat responses will appear here</div>
      </div>
    </div>
  );
};

export default AskKB;
