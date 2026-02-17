import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faGlasses, faFolder, faChevronLeft, faChevronRight, faStar, faCheck, faPenToSquare, faLink } from '@fortawesome/free-solid-svg-icons';
import logo from '../assets/logo.png';
import './StackView.css';

const StackView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [cardStatuses, setCardStatuses] = useState({});
  const [isFlipping, setIsFlipping] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const copyTimeoutRef = useRef(null);

  const stacks = [
    { id: 1, name: 'Midterm', class: 'HCI', cardCount: 12 },
    { id: 2, name: 'Final', class: 'HCI', cardCount: 12 },
    { id: 3, name: 'Exam Review', class: 'HCI', cardCount: 12 },
    { id: 4, name: 'Unit 6 Vocabulary', class: 'AP HuG', cardCount: 50 },
  ];
  const stackId = Number(id);
  const stack = stacks.find((item) => item.id === stackId) ?? stacks[0];

  const defaultCards = (stackName) => [
    { id: 1, term: `${stackName} Term 1`, definition: `Definition for ${stackName} term 1.` },
    { id: 2, term: `${stackName} Term 2`, definition: `Definition for ${stackName} term 2.` },
    { id: 3, term: `${stackName} Term 3`, definition: `Definition for ${stackName} term 3.` },
  ];

  const flashcardsByStack = {
    1: [
      { id: 1, term: 'Midterm Review', definition: 'Key concepts and topics to study for the midterm.' },
      { id: 2, term: 'Usability', definition: 'The measure of how effectively users can achieve goals.' },
      { id: 3, term: 'Accessibility', definition: 'Designing products to be usable by people with a wide range of abilities.' },
    ],
    2: [
      { id: 1, term: 'Final Project', definition: 'Requirements and milestones for the final deliverable.' },
      { id: 2, term: 'Evaluation', definition: 'Methods to test and validate product quality.' },
      { id: 3, term: 'Iteration', definition: 'Refining a design through repeated testing and improvements.' },
    ],
    4: [
      { id: 1, term: 'Core-Periphery Model', definition: 'A model of the spatial structure of an economic system in which underdeveloped or declining peripheral areas are defined with respect to their dependence on a dominating core region' },
      { id: 2, term: 'Cultural divergence', definition: 'the restriction of a culture from outside cultural influences' },
      { id: 3, term: 'Dependency Theory', definition: 'a model of economic and social development that explains global inequality in terms of the historical exploitation of poor nations by rich ones' },
      { id: 4, term: 'Development', definition: 'The process of growth, expansion, or realization of potential; bringing regional resources into full productive use.' },
      { id: 5, term: 'Foreign direct investment', definition: 'investment in the economies of LCDs by transnational corporations based in MDCs' },
      { id: 6, term: 'GDP', definition: 'Gross Domestic Product, the total value of goods produced and services provided in a country during one year' },
      { id: 7, term: 'GNP', definition: 'Gross National Product, the total value of goods produced and services provided by a country\'s residents during one year' },
      { id: 8, term: 'Human Development Index', definition: 'A composite statistic of life expectancy, education, and per capita income indicators, which are used to rank countries into four tiers of human development' },
      { id: 9, term: 'Neocolonialism', definition: 'The practice of using capitalism, globalization, and cultural imperialism to influence a developing country instead of direct military control or political rule' },
      { id: 10, term: 'Purchasing Power Parity', definition: 'A theory which states that in the long run, exchange rates should move towards the rate that would equalize the prices of an identical basket of goods and services in any two countries' },
      { id: 11, term: 'Rostow, W.W.', definition: 'An American economist known for his theory of economic growth and the stages of economic development' },
      { id: 12, term: 'Stages of Model Growth', definition: '• Literacy\n• Communications\n• Productivity per worker\n• All countries follow the same or similar path or development\n• 5 Stages of his models\n• Traditional sense\n• Preconditions to take off\n• Take off\n• Drive to maturity\n• High mass consumption' },
      { id: 13, term: 'Third World', definition: 'A term applied to countries considered not yet fully developed or in a state of underdevelopment in economic and social terms.' },
      { id: 14, term: 'World Systems', definition: 'Wallerstein\'s theory of the core, semi-periphery, periphery, and external areas. The core benefited the most from the development of a capitalist world economy. The semi-periphery was the buffer between the core and periphery. The periphery are states that lack strong central governments or are controlled by other states. External areas are states that maintained their own economic system and for the most part, remained outside of the capitalist world economy' },
      { id: 15, term: 'Acid Rain', definition: 'Precipitation that is significantly more acidic than normal, caused by emissions of sulfur dioxide and nitrogen oxide from industrial processes' },
      { id: 16, term: 'Agglomeration', definition: 'The clustering of businesses and industries in a particular area to benefit from shared services, infrastructure, and labor markets' },
      { id: 17, term: 'Assembly line production/Fordism', definition: 'A system of industrial production designed for mass production, characterized by the use of assembly lines and standardized parts' },
      { id: 18, term: 'Bid Rent Theory', definition: 'A geographical economic theory that refers to how the price and demand for real estate change as the distance from the central business district (CBD) increases' },
      { id: 19, term: 'Break-of-Bulk point', definition: 'A location where goods are transferred from one mode of transportation to another, such as from a ship to a truck or train' },
      { id: 20, term: 'Comparative Advantage', definition: 'The ability of a country or region to produce a particular good or service at a lower opportunity cost than its trading partners' },
      { id: 21, term: 'Cumulative Causation', definition: 'The process by which economic growth in a particular area leads to further growth and development, creating a positive feedback loop' },
      { id: 22, term: 'Deglomeration', definition: 'The process of businesses and industries moving away from a concentrated area to reduce costs and improve efficiency' },
      { id: 23, term: 'Deindustrialization', definition: 'The decline of industrial activity in a region or economy, often associated with the reduction of manufacturing jobs and the shift towards a service-based economy' },
      { id: 24, term: 'Economic Sectors', definition: 'The 3 main processes that take goods to consumers, converting raw materials into finished products. The primary sector includes all industries that take raw materials from the earth. This is where manufacturing and processing industries use raw materials to make other goods. This sector includes all businesses that transfer the goods produced by primary and secondary industries to consumers through their shops, offices and informal trade.' },
      { id: 25, term: 'Ecotourism', definition: 'A form of sustainable travel that supports the conservation of natural environments and the well-being of local communities' },
      { id: 26, term: 'Energy resources', definition: 'Resources that provide energy; include fossil fuels, biomass, geothermal energy, solar energy, hydroelectric energy, nuclear energy, and wind energy.' },
      { id: 27, term: 'Entrepot', definition: 'A port, city, or trading post where goods are imported, stored, and then exported.' },
      { id: 28, term: 'Export processing zone', definition: 'A designated area within a country where goods can be imported, manufactured, and exported without being subject to the usual customs regulations.' },
      { id: 29, term: 'Fixed costs', definition: 'Costs that do not change with the level of output or production, such as rent, salaries, and insurance.' },
      { id: 30, term: 'Footloose industry', definition: 'An industry that can be located anywhere without being affected by factors such as resources, transportation, or labor.' },
      { id: 31, term: 'Four tigers', definition: 'Refers to the highly developed economies of Hong Kong, Singapore, South Korea, and Taiwan, known for their rapid industrialization and high growth rates.' },
      { id: 32, term: 'Growth Poles', definition: 'Economic development is not uniform over an entire region, but instead takes place around a specific pole or cluster.' },
      { id: 33, term: 'Industrial Location Theory', definition: 'A theory that explains the geographic location of industries based on factors such as transportation, labor, and agglomeration economies.' },
      { id: 34, term: 'International Division of Labor', definition: 'The specialization of different countries in particular types of economic activities, such as manufacturing or services, to increase efficiency and productivity.' },
      { id: 35, term: 'Least-cost location', definition: 'A concept in economic geography that refers to the optimal location for a business or industry based on minimizing costs such as transportation, labor, and agglomeration.' },
      { id: 36, term: 'Maquiladora', definition: 'A factory in Mexico run by a foreign company and exporting its products to the country of that company.' },
      { id: 37, term: 'Multiplier Effect', definition: 'The concept that an initial investment or economic activity can lead to a chain reaction of additional economic activity and growth.' },
      { id: 38, term: 'NAFTA', definition: 'The North American Free Trade Agreement, a trade deal between the United States, Canada, and Mexico aimed at reducing trade barriers and promoting economic cooperation.' },
      { id: 39, term: 'Outsourcing', definition: 'The practice of obtaining goods or services from an external supplier, often from another country, to reduce costs or focus on core business activities.' },
      { id: 40, term: 'Postindustrial', definition: 'a stage of economic development in which service activities become relatively more important than goods production; professional and technical employment supersedes employment in agriculture and manufacturing; and level of living is defined by the quality of services and amenities rather than by the quantity of goods available.' },
      { id: 41, term: 'Special economic zones', definition: 'Designated areas within a country that have different economic regulations than the rest of the country, often to attract foreign investment and promote economic growth.' },
      { id: 42, term: 'Time-Space compression', definition: 'The concept that the world is becoming increasingly interconnected and that distances between places are effectively shrinking due to advancements in transportation and communication technologies.' },
      { id: 43, term: 'Transnational corporation', definition: 'A company that operates in multiple countries, managing production or delivering services across national borders.' },
      { id: 44, term: 'Variable costs', definition: 'Costs that change with the level of output or production, such as raw materials, energy, and labor directly involved in production.' },
      { id: 45, term: 'Weber, Alfred', definition: 'A German economist known for his theory of industrial location, which explains the optimal location of industries based on minimizing transportation and labor costs.' },
      { id: 46, term: 'Weight-gaining', definition: 'Refers to industries where the final product is heavier or bulkier than the raw materials, influencing the location of production closer to the market to reduce transportation costs.' },
      { id: 47, term: 'Weight-losing', definition: 'Refers to industries where the final product is lighter or less bulky than the raw materials, influencing the location of production closer to the raw materials to reduce transportation costs.' },
      { id: 48, term: 'World Cities', definition: 'Major cities that are influential on a global scale due to their economic, political, and cultural significance.' },
      { id: 49, term: 'Brownfields', definition: 'Previously developed land that is not currently in use and may be potentially contaminated, often targeted for redevelopment.' },
      { id: 50, term: 'Containerization', definition: 'The use of standardized containers for the efficient transport of goods, facilitating global trade and reducing shipping costs.' },
    ],
  };
  const stackCards = flashcardsByStack[stack.id] ?? defaultCards(stack.name);

  const handleBack = () => {
    if (isStudyMode) {
      setIsStudyMode(false);
      setCurrentCardIndex(0);
      setShowDefinition(false);
    } else {
      navigate(-1);
    }
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleStudy = () => {
    setIsStudyMode(true);
    setCurrentCardIndex(0);
    setShowDefinition(false);
  };

  const handleEdit = () => {
    navigate('/stack/new', {
      state: {
        stackName: stack.name,
        cards: stackCards,
      },
    });
  };

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/stack/${stack.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setIsLinkCopied(true);
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(() => {
      setIsLinkCopied(false);
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setShowDefinition(false);
    }
  };

  const handleNextCard = () => {
    if (currentCardIndex < stackCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setShowDefinition(false);
    }
  };

  const handleCardClick = () => {
    if (isFlipping) return;
    setIsFlipping(true);
    setTimeout(() => setShowDefinition(!showDefinition), 125);
    setTimeout(() => setIsFlipping(false), 250);
  };

  const handleStar = () => {
    const cardId = stackCards[currentCardIndex].id;
    setCardStatuses(prev => ({
      ...prev,
      [cardId]: prev[cardId] === 'star' ? null : 'star'
    }));
  };

  const handleCheckCard = () => {
    const cardId = stackCards[currentCardIndex].id;
    setCardStatuses(prev => ({
      ...prev,
      [cardId]: prev[cardId] === 'check' ? null : 'check'
    }));
  };

  const toggleCardStatus = (cardId, status) => {
    setCardStatuses(prev => ({
      ...prev,
      [cardId]: prev[cardId] === status ? null : status
    }));
  };

  return (
    <div className="stack-view-page">
      <header className="stack-view-header">
        <button className="back-button" onClick={handleBack}>
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        
        <div className="logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="Stackd Logo" className="logo-image" />
          <h1 className="logo-text">Stackd</h1>
        </div>

        {!isStudyMode ? (
          <button className="profile-button">
            <FontAwesomeIcon icon={faUser} />
          </button>
        ) : (
          <div className="profile-button-placeholder"></div>
        )}
      </header>

      <div className="stack-view-content">
        {!isStudyMode ? (
          <>
            <div className="stack-actions">
              <button
                className="stack-side-button stack-side-button-link"
                onClick={handleCopyLink}
                aria-label="Copy stack link"
              >
                <FontAwesomeIcon icon={faLink} />
              </button>
              <div className="stack-card-large">
                <div className="stack-layer-back"></div>
                <div className="stack-layer-middle"></div>
                <div className="stack-layer-front">
                  <span>{stack.name}</span>
                </div>
              </div>
              <button
                className="stack-side-button stack-side-button-edit"
                onClick={handleEdit}
                aria-label="Edit stack"
              >
                <FontAwesomeIcon icon={faPenToSquare} />
              </button>
            </div>

            {isLinkCopied && (
              <div className="copy-toast" role="status" aria-live="polite">
                Link copied
              </div>
            )}

            <div className="stack-info">
              <div className="info-item">
                <FontAwesomeIcon icon={faFolder} className="info-icon" />
                <span>{stack.class}</span>
              </div>
              <div className="info-item">
                <span>{stackCards.length} Cards</span>
              </div>
            </div>

            <div className="stack-action-buttons">
              <button className="view-button" onClick={handleStudy}>
                <FontAwesomeIcon icon={faGlasses} />
                <span>view</span>
              </button>
            </div>

            <div className="flashcards-list">
              <div className="flashcards-header">
                <span>Term</span>
                <span>Definition</span>
              </div>
              
              {stackCards.map((card, index) => (
                <div key={card.id} className="flashcard-item">
                  <div className="flashcard-row">
                    <div className="term-box">
                      <div className="term-content">
                        <span>{card.term}</span>
                      </div>
                      <div className="card-status-buttons">
                        <button 
                          className={`status-btn-inline star ${cardStatuses[card.id] === 'star' ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCardStatus(card.id, 'star');
                          }}
                        >
                          <FontAwesomeIcon icon={faStar} />
                        </button>
                        <button 
                          className={`status-btn-inline check ${cardStatuses[card.id] === 'check' ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCardStatus(card.id, 'check');
                          }}
                        >
                          <FontAwesomeIcon icon={faCheck} />
                        </button>
                      </div>
                    </div>
                    <div className="definition-box">
                      <span>{card.definition}</span>
                    </div>
                  </div>
                  {index < stackCards.length - 1 && <div className="flashcard-divider"></div>}
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="study-mode">
              <div className="stack-card-large study-card-display">
                <div className="stack-layer-back"></div>
                <div className="stack-layer-middle"></div>
                <div className="stack-layer-front">
                  <span>{stack.name}</span>
                </div>
              </div>

              <button className="view-button study-active" onClick={() => setIsStudyMode(false)}>
                <FontAwesomeIcon icon={faGlasses} />
                <span>view</span>
              </button>

              <div className="card-counter">
                <span>{currentCardIndex + 1}/{stackCards.length}</span>
              </div>

              <div className="study-flashcard-container">
                <button 
                  className="nav-arrow left-arrow" 
                  onClick={handlePrevCard}
                  disabled={currentCardIndex === 0}
                >
                  <FontAwesomeIcon icon={faChevronLeft} />
                </button>

                <div className={`study-flashcard ${isFlipping ? 'flipping' : ''}`} onClick={handleCardClick}>
                  {cardStatuses[stackCards[currentCardIndex].id] && (
                    <div className={`card-status-badge ${cardStatuses[stackCards[currentCardIndex].id]}`}>
                      <FontAwesomeIcon icon={cardStatuses[stackCards[currentCardIndex].id] === 'star' ? faStar : faCheck} />
                    </div>
                  )}
                  <span className="study-card-text">
                    {showDefinition 
                      ? stackCards[currentCardIndex].definition 
                      : stackCards[currentCardIndex].term}
                  </span>
                </div>

                <button 
                  className="nav-arrow right-arrow" 
                  onClick={handleNextCard}
                  disabled={currentCardIndex === stackCards.length - 1}
                >
                  <FontAwesomeIcon icon={faChevronRight} />
                </button>
              </div>

              <div className="study-actions-bar">
                <button className={`study-action-btn star-btn ${cardStatuses[stackCards[currentCardIndex].id] === 'star' ? 'active' : ''}`} onClick={handleStar}>
                  <FontAwesomeIcon icon={faStar} />
                </button>
                <button className={`study-action-btn check-btn ${cardStatuses[stackCards[currentCardIndex].id] === 'check' ? 'active' : ''}`} onClick={handleCheckCard}>
                  <FontAwesomeIcon icon={faCheck} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StackView;
