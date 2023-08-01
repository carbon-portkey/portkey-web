import { Collapse, List } from 'antd';
import { NFTCollectionItemShowType, NFTItemBaseType } from '../../../types/assets';
import { useCallback, useState } from 'react';
import { transNetworkText } from '../../../../utils/converter';
import clsx from 'clsx';
import CustomSvg from '../../../CustomSvg';
import { ChainId } from '@portkey/types';
import useNFTMaxCount from '../../../../hooks/useNFTMaxCount';
import './index.less';

export interface NFTTabProps {
  isMainnet?: boolean;
  accountNFTList?: NFTCollectionItemShowType[];
  loadMoreNFT?: (params: { symbol: string; chainId: ChainId; pageNum: number }) => void;
}

export default function NFTTab({ accountNFTList, isMainnet, loadMoreNFT }: NFTTabProps) {
  const [openPanel, setOpenPanel] = useState<string[]>([]);
  const [nftNum, setNftNum] = useState<Record<string, number>>({});
  const [getMoreFlag, setGetMoreFlag] = useState(false);

  const maxNftNum = useNFTMaxCount();

  const getMore = useCallback(
    async (symbol: string, chainId: ChainId) => {
      if (getMoreFlag) return;
      const nftColKey = `${symbol}_${chainId}`;
      const curNftNum = nftNum[nftColKey];
      setGetMoreFlag(true);

      loadMoreNFT?.({
        symbol,
        chainId: chainId as ChainId,
        pageNum: curNftNum,
      });
      setNftNum({ ...nftNum, [nftColKey]: curNftNum + 1 });
      setGetMoreFlag(false);
    },
    [getMoreFlag, nftNum, loadMoreNFT],
  );

  const handleChange = useCallback(
    (arr: string[] | string) => {
      console.log(arr, 'arr===handleChange');
      const openArr = typeof arr === 'string' ? [arr] : arr;
      openPanel.forEach((prev: string) => {
        if (!openArr.some((cur: string) => cur === prev)) {
          setNftNum({ ...nftNum, [prev]: 0 });
        }
      });
      openArr.forEach((cur: string) => {
        if (!openPanel.some((prev: string) => cur === prev)) {
          const curTmp = cur.split('_');

          loadMoreNFT?.({
            symbol: curTmp[0],
            chainId: curTmp[1] as ChainId,
            pageNum: 0,
          });

          setNftNum({ ...nftNum, [cur]: 1 });
        }
      });
      setOpenPanel(openArr);
    },
    [loadMoreNFT, nftNum, openPanel],
  );

  const renderItem = useCallback(
    (nft: NFTCollectionItemShowType) => {
      const nftColKey = `${nft.symbol}_${nft.chainId}`;
      if (!nft.symbol) return null;
      return (
        <Collapse.Panel
          key={nftColKey}
          header={
            <div className="protocol">
              <div className="avatar">
                {nft.imageUrl ? <img src={nft.imageUrl} /> : nft.collectionName?.slice(0, 1)}
              </div>
              <div className="info">
                <p className="alias">{nft.collectionName}</p>
                <p className="network">{transNetworkText(nft.chainId, isMainnet)}</p>
              </div>
              <div className="amount">{nft.itemCount}</div>
            </div>
          }>
          <div className="list">
            {!!nftNum[nftColKey] &&
              nft.children.map((nftItem: NFTItemBaseType, index: number) => {
                const curNftNum = nftNum[nftColKey] ?? 0;
                return (
                  index < curNftNum * maxNftNum && (
                    <div
                      key={`${nft.symbol}-${nftItem.symbol}`}
                      style={{
                        backgroundImage: `url('${nftItem.imageUrl}')`,
                      }}
                      className={clsx(['item', nftItem.imageUrl ? 'item-img' : ''])}>
                      <div className="mask">
                        <p className="alias">{nftItem.alias}</p>
                        <p className="token-id">#{nftItem.tokenId}</p>
                      </div>
                    </div>
                  )
                );
              })}
            {!!nftNum[nftColKey] && Number(nft.totalRecordCount) > nftNum[nftColKey] * maxNftNum && (
              <div
                className="load-more"
                onClick={() => {
                  getMore?.(nft.symbol, nft.chainId);
                }}>
                <CustomSvg type="Down" /> More
              </div>
            )}
          </div>
        </Collapse.Panel>
      );
    },
    [getMore, isMainnet, maxNftNum, nftNum],
  );

  return (
    <div className="portkey-ui-nft-tab">
      {accountNFTList?.length === 0 || !accountNFTList ? (
        <p className="empty-text">No NFTs yet</p>
      ) : (
        <List className="nft-list">
          <List.Item>
            <Collapse onChange={handleChange}>{accountNFTList.map((item) => renderItem(item))}</Collapse>
          </List.Item>
        </List>
      )}
    </div>
  );
}
