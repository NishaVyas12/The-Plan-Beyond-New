import './Reviews.css';
import Like from '../../assets/images/icons/Like.svg';
import Dislike from '../../assets/images/icons/DisLike.svg';
import Magnifer from '../../assets/images/icons/Magnifer.svg';

const Reviews = () => {
    const ratingData = [10, 4, 2, 0, 0];
    const tags = ['Process', 'Sports', 'Design', 'Trust', 'Document', 'Price', 'Will'];

    return (
        <div className="reviews-container">
            <div className="reviews-header">
                <h1>
                    <span>Reviews &</span> <span className="highlight">Ratings</span>
                </h1>
                <p>
                    Here’s what our users have to say about planning ahead with The Plan Beyond —
                    and the peace of mind it’s brought them and their families.
                </p>
            </div>
            <div className="reviews-top-row">
                <div className="ratings-left">
                    <div className="rating-summary">
                        <div className="rating-score">4.64</div>
                        <div className="rating-text">Excellent</div>
                        <div className="stars">
                            <span>★</span>
                            <span>★</span>
                            <span>★</span>
                            <span>★</span>
                            <span>★</span>
                        </div>
                        <div className="rating-link">4.6 21 Reviews</div>
                    </div>

                    <div className="rating-bars">
                        {[5, 4, 3, 2, 1].map((star, index) => (
                            <div className="bar-row" key={star}>
                                <input type="checkbox" />
                                <span className="star-label">{star} stars</span>
                                <div className="bar-bg">
                                    <div
                                        className="bar-fill"
                                        style={{ width: `${ratingData[index] * 10}%` }}
                                    ></div>
                                </div>
                                <span className="bar-count">{ratingData[index]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="search-mentions">
                    <div className="search-wrapper">
                        <img src={Magnifer} alt="" className="search-icon" />
                        <input className="search-input" placeholder="Search here..." />
                    </div>

                    <p className="mention-tags">Top mentions</p>
                    <div className="mention-tags">
                        {tags.map((tag) => (
                            <span key={tag} className="tag">{tag}</span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="review-card">
                <div className="review-top">
                    <div className="review-stars">
                        <span>★</span>
                        <span>★</span>
                        <span>★</span>
                        <span>★</span>
                        <span>★</span>
                    </div>
                    <span className="review-date">06/28/2024</span>
                </div>

                <h3>Modern tool for planning with heart.</h3>
                <p>
                    What I love most is how seamlessly I can decide who gets what and when. It’s
                    such a refreshing experience compared to what I imagined this process would be
                    like. Honestly, I wish this had existed sooner.
                </p>

                <div className="review-footer">
                    <div className="review-profile">
                        <img src="https://i.pravatar.cc/100?img=1" alt="Reviewer" />
                        <span>Seema, 45</span>
                    </div>
                    <div className="review-meta">
                        <div className="review-feedback">
                            <span>Was this review helpful?</span>
                            <span className="icon-group">
                                <img src={Like} alt="Like" className="review-like" />
                                25
                            </span>
                            <span className="icon-group">
                                <img src={Dislike} alt="Dislike" className="review-dislike" />
                                3
                            </span>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Reviews;