'use strict';

const e = React.createElement;
const POLL_INTERVAL = 3000;

class VoteCount extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            voteCount: props.initialVoteCount || 0
        };
        console.log('Adding react component to track upvotes for commentId = ', props.commentId);
        // Call getVoteItem
        this.getVoteItem();
        // Poll getVoteItem on regular interval
        this.pollInterval = setInterval(this.getVoteItem, POLL_INTERVAL);
    }

    componentWillUnmount() {
        // Cleanup
        clearInterval(this.pollInterval);
    }

    /**
     * Fetches the latest voteCount for the current comment and sets state
     */
    getVoteItem = () => {
        const { commentId } = this.props;
        const comment = (async () => {
            return GET('getComment', { commentId });
        })();
        comment.then(value => {
            const { id, voteCount } = value;
            const commentIdMatches = id === commentId;
            if (commentIdMatches) {
                this.setState({ voteCount });
            }
        })
        comment.catch(error => {
            // Handle error
            console.log(errr);
        })
    }

    render() {
        const { voteCount } = this.state;
        const voteCountDisplay = voteCount > 0 ? `(${voteCount})` : '';
        return e(
            'span',
            {},
            `${voteCountDisplay}`
        );
    }
}

// Find all DOM containers, and render Like buttons into them.
document.querySelectorAll('.vote-count')
    .forEach(domContainer => {
        // Get comment ID from data attribute
        const commentId = parseInt(domContainer.dataset.commentid, 10);
        const initialVoteCount = parseInt(domContainer.dataset.initialcount, 10);
        const root = ReactDOM.createRoot(domContainer);
        const props = { commentId, initialVoteCount };
        root.render(
            e(VoteCount, props)
        );
    });
